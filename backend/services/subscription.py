"""
Subscription Service - Plan limits, usage tracking, and enforcement.

BUGFIX (2026-02-28):
  check_feature_access() was building the limit key with an f-string:
      limit_key = f"{feature}s_per_day"
  For feature="cv_analysis" this produced "cv_analysiss_per_day" (double-s),
  which never matched "cv_analyses_per_day" in PLAN_LIMITS.
  limits.get("cv_analysiss_per_day", 0) → 0 → "feature locked" for ALL free users.

  Fix: use FEATURE_LIMIT_KEYS dict for exact key names.
  Also: default to None (not 0) so unknown features fail open, not locked.
"""

from datetime import date
from functools import wraps
from flask import g, jsonify
from database import get_supabase


# ── Plan limits (mirrors the plans table) ────────────────────────────────────
PLAN_LIMITS = {
    "free": {
        "cv_analyses_per_day":    3,
        "cover_letters_per_day":  0,   # 0 = feature locked
        "job_results_limit":      5,
        "resumes_limit":          1,
        "cv_refinement":          False,
    },
    "seeker": {
        "cv_analyses_per_day":    20,
        "cover_letters_per_day":  10,
        "job_results_limit":      15,
        "resumes_limit":          3,
        "cv_refinement":          True,
    },
    "pro": {
        "cv_analyses_per_day":    -1,  # -1 = unlimited
        "cover_letters_per_day":  -1,
        "job_results_limit":      15,
        "resumes_limit":          10,
        "cv_refinement":          True,
    },
}

FEATURE_LABELS = {
    "cv_analysis":  "CV analyses",
    "cover_letter": "cover letters",
    "job_search":   "job searches",
}

# BUGFIX: Maps feature name → the exact key in PLAN_LIMITS
# The old code did f"{feature}s_per_day" which gave "cv_analysiss_per_day" — wrong!
FEATURE_LIMIT_KEYS = {
    "cv_analysis":  "cv_analyses_per_day",    # note: analyses, not analysiss
    "cover_letter": "cover_letters_per_day",
    "job_search":   "job_results_limit",
}


# ── Core helpers ──────────────────────────────────────────────────────────────

def get_user_subscription(user_id: str) -> dict:
    """Return the user's subscription row (defaults to free if missing)."""
    try:
        client = get_supabase()
        result = (
            client.table("subscriptions")
            .select("*, plans(*)")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if result.data:
            return result.data
    except Exception as e:
        print(f"[Subscription] get error: {e}")

    # Fallback — create free subscription on the fly
    return _ensure_free_subscription(user_id)


def _ensure_free_subscription(user_id: str) -> dict:
    """Create a free subscription row if one doesn't exist yet."""
    try:
        client = get_supabase()
        client.table("subscriptions").upsert({
            "user_id": user_id,
            "plan_id": "free",
            "status":  "active",
        }).execute()
    except Exception as e:
        print(f"[Subscription] ensure free error: {e}")

    return {
        "plan_id": "free",
        "status":  "active",
        "plans":   {"id": "free", "name": "Free", **PLAN_LIMITS["free"]},
    }


def get_plan_id(user_id: str) -> str:
    """Return the user's current plan id string."""
    sub = get_user_subscription(user_id)
    # Allow "trialing" status too — some payment flows use it briefly
    if sub.get("status") not in ("active", "trialing"):
        return "free"
    plan_id = sub.get("plan_id", "free")
    # Sanity check — if DB has an unknown plan, default to free
    if plan_id not in PLAN_LIMITS:
        print(f"[Subscription] Unknown plan_id '{plan_id}' for user {user_id}, defaulting to free")
        return "free"
    return plan_id


def get_plan_limits(plan_id: str) -> dict:
    """Return limit dict for a plan id."""
    return PLAN_LIMITS.get(plan_id, PLAN_LIMITS["free"])


# ── Usage tracking ────────────────────────────────────────────────────────────

def get_today_usage(user_id: str, feature: str) -> int:
    """Return how many times the user has used a feature today."""
    try:
        client = get_supabase()
        result = (
            client.table("usage_tracking")
            .select("count")
            .eq("user_id", user_id)
            .eq("usage_date", date.today().isoformat())
            .eq("feature", feature)
            .execute()
        )
        if result.data:
            return result.data[0]["count"]
    except Exception as e:
        print(f"[Usage] get error: {e}")
    return 0


def increment_usage(user_id: str, feature: str) -> int:
    """Increment usage count for today, return new count."""
    try:
        client = get_supabase()
        today = date.today().isoformat()

        existing = (
            client.table("usage_tracking")
            .select("id, count")
            .eq("user_id", user_id)
            .eq("usage_date", today)
            .eq("feature", feature)
            .execute()
        )

        if existing.data:
            new_count = existing.data[0]["count"] + 1
            client.table("usage_tracking").update({
                "count":      new_count,
                "updated_at": "now()",
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            new_count = 1
            client.table("usage_tracking").insert({
                "user_id":    user_id,
                "usage_date": today,
                "feature":    feature,
                "count":      1,
            }).execute()

        return new_count
    except Exception as e:
        print(f"[Usage] increment error: {e}")
        return 0


def get_usage_summary(user_id: str) -> dict:
    """
    Return a full usage summary for the user — used by the frontend
    to render the usage counter widget.
    """
    plan_id = get_plan_id(user_id)
    limits  = get_plan_limits(plan_id)

    features = ["cv_analysis", "cover_letter"]
    summary  = {"plan": plan_id, "features": {}}

    for feature in features:
        limit_key = FEATURE_LIMIT_KEYS.get(feature, f"{feature}s_per_day")
        limit     = limits.get(limit_key, 0)
        used      = get_today_usage(user_id, feature)

        summary["features"][feature] = {
            "used":      used,
            "limit":     limit,
            "remaining": max(0, limit - used) if limit != -1 else -1,
            "locked":    limit == 0,
            "unlimited": limit == -1,
        }

    return summary


# ── Enforcement helpers ───────────────────────────────────────────────────────

def check_feature_access(user_id: str, feature: str) -> tuple[bool, dict | None]:
    """
    Check if user can use a feature right now.

    Returns:
        (True, None)           — access granted
        (False, error_dict)    — access denied with reason payload

    BUGFIX: old code: limit_key = f"{feature}s_per_day"
      → "cv_analysis" + "s" = "cv_analysiss_per_day" (double-s, never matched)
      → limits.get(bad_key, 0) → 0 → feature_locked for ALL free users
    Now uses FEATURE_LIMIT_KEYS for correct key lookup.
    Unknown keys now fail OPEN (allow) instead of silently locking users out.
    """
    plan_id = get_plan_id(user_id)
    limits  = get_plan_limits(plan_id)

    # Use the explicit mapping — no more f-string typo
    limit_key = FEATURE_LIMIT_KEYS.get(feature, f"{feature}s_per_day")
    limit     = limits.get(limit_key)  # None if key not found (not 0!)

    # Unknown feature key — fail open rather than silently blocking users
    if limit is None:
        print(f"[Subscription] Warning: unknown limit key '{limit_key}' for feature '{feature}' "
              f"on plan '{plan_id}'. Allowing access to avoid false lockout.")
        return True, None

    # Feature completely locked on this plan (limit explicitly set to 0)
    if limit == 0:
        label = FEATURE_LABELS.get(feature, feature)
        return False, {
            "error":            f"{label.capitalize()} are not available on the {plan_id.capitalize()} plan.",
            "error_code":       "feature_locked",
            "upgrade_required": True,
            "current_plan":     plan_id,
        }

    # Unlimited (-1)
    if limit == -1:
        return True, None

    # Check daily quota
    used = get_today_usage(user_id, feature)
    if used >= limit:
        label = FEATURE_LABELS.get(feature, feature)
        return False, {
            "error":            f"You've used all {limit} {label} for today. Resets at midnight.",
            "error_code":       "daily_limit_reached",
            "used":             used,
            "limit":            limit,
            "upgrade_required": True,
            "current_plan":     plan_id,
        }

    return True, None


def check_cv_refinement_access(user_id: str) -> tuple[bool, dict | None]:
    """Check if user's plan includes CV refinement."""
    plan_id = get_plan_id(user_id)
    limits  = get_plan_limits(plan_id)

    if not limits.get("cv_refinement", False):
        return False, {
            "error":            "CV refinement is not available on the Free plan.",
            "error_code":       "feature_locked",
            "upgrade_required": True,
            "current_plan":     plan_id,
        }
    return True, None


def get_job_results_limit(user_id: str) -> int:
    """Return how many job results this user can see."""
    plan_id = get_plan_id(user_id)
    return get_plan_limits(plan_id).get("job_results_limit", 5)


# ── Route decorators ─────────────────────────────────────────────────────────

def require_feature(feature: str):
    """
    Decorator for Flask routes — checks access and increments usage on success.

    Usage:
        @require_feature("cv_analysis")
        @require_auth
        def my_route():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            allowed, error = check_feature_access(g.user_id, feature)
            if not allowed:
                return jsonify(error), 403

            # Run the route
            response = f(*args, **kwargs)

            # Only increment on successful responses (2xx)
            try:
                status = response[1] if isinstance(response, tuple) else 200
                if 200 <= status < 300:
                    increment_usage(g.user_id, feature)
            except Exception:
                increment_usage(g.user_id, feature)

            return response
        return wrapper
    return decorator