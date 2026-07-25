"""
services/subscription.py
------------------------
Plan limits, usage tracking, and enforcement for CandorApply.

Tiers:
  free   — try the product, low limits
  seeker — $4/mo, serious job seekers
  pro    — $9/mo, power users, unlimited AI

BUGFIX (2026-02-28):
  check_feature_access() was building the limit key with an f-string:
      limit_key = f"{feature}s_per_day"
  For feature="cv_analysis" this produced "cv_analysiss_per_day" (double-s),
  which never matched "cv_analyses_per_day" in PLAN_LIMITS.
  Fix: use FEATURE_LIMIT_KEYS dict for exact key names.
"""

from datetime import date
from functools import wraps
from flask import g, jsonify
from database import get_supabase


# ── Plan limits ───────────────────────────────────────────────────────────────
# -1  = unlimited
#  0  = feature completely locked (not available on this plan)
# N   = N uses per day (for per_day keys) or hard cap (for _limit keys)

PLAN_LIMITS = {
    "free": {
        # AI features — per day
        "cv_analyses_per_day":        3,
        "cover_letters_per_day":      0,    # locked — upgrade to use
        "apply_briefings_per_day":    1,
        "interview_prep_per_day":     2,
        "cv_generations_per_day":     0,    # locked
        "autofill_per_day":           5,    # extension autofill
        # Hard caps
        "job_results_limit":          5,
        "resumes_limit":              1,
        # Boolean features
        "cv_refinement":              False,
        "recommended_jobs":           False, # /jobs/recommend locked on free
        "extension_access":           True,
    },
    "seeker": {
        "cv_analyses_per_day":        20,
        "cover_letters_per_day":      10,
        "apply_briefings_per_day":    10,
        "interview_prep_per_day":     20,
        "cv_generations_per_day":     5,
        "autofill_per_day":           50,
        "job_results_limit":          50,
        "resumes_limit":              3,
        "cv_refinement":              True,
        "recommended_jobs":           True,
        "extension_access":           True,
    },
    "pro": {
        "cv_analyses_per_day":        -1,
        "cover_letters_per_day":      -1,
        "apply_briefings_per_day":    -1,
        "interview_prep_per_day":     -1,
        "cv_generations_per_day":     -1,
        "autofill_per_day":           -1,
        "job_results_limit":          200,
        "resumes_limit":              10,
        "cv_refinement":              True,
        "recommended_jobs":           True,
        "extension_access":           True,
    },
}

# Human-readable labels for error messages
FEATURE_LABELS = {
    "cv_analysis":      "CV analyses",
    "cover_letter":     "cover letters",
    "apply_briefing":   "apply briefings",
    "interview_prep":   "interview prep sessions",
    "cv_generation":    "CV generations",
    "autofill":         "autofills",
    "job_search":       "job searches",
}

# Maps feature name → exact key in PLAN_LIMITS (avoids f-string typo bugs)
FEATURE_LIMIT_KEYS = {
    "cv_analysis":      "cv_analyses_per_day",
    "cover_letter":     "cover_letters_per_day",
    "apply_briefing":   "apply_briefings_per_day",
    "interview_prep":   "interview_prep_per_day",
    "cv_generation":    "cv_generations_per_day",
    "autofill":         "autofill_per_day",
    "job_search":       "job_results_limit",
}


# ── Subscription helpers ──────────────────────────────────────────────────────

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
    sub     = get_user_subscription(user_id)
    status  = sub.get("status", "active")
    plan_id = sub.get("plan_id", "free")
    if status not in ("active", "trialing"):
        return "free"
    if plan_id not in PLAN_LIMITS:
        print(f"[Subscription] Unknown plan '{plan_id}' for user {user_id}, defaulting to free")
        return "free"
    return plan_id


def get_plan_limits(plan_id: str) -> dict:
    return PLAN_LIMITS.get(plan_id, PLAN_LIMITS["free"])


# ── Usage tracking (Supabase usage_tracking table) ────────────────────────────

def get_today_usage(user_id: str, feature: str) -> int:
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
        today  = date.today().isoformat()

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
    Full usage summary — consumed by the frontend usage widget
    and the /subscription endpoint.
    """
    plan_id = get_plan_id(user_id)
    limits  = get_plan_limits(plan_id)
    summary = {"plan": plan_id, "features": {}}

    for feature, limit_key in FEATURE_LIMIT_KEYS.items():
        limit = limits.get(limit_key, 0)
        used  = get_today_usage(user_id, feature) if limit not in (0, -1) else 0
        summary["features"][feature] = {
            "used":      used,
            "limit":     limit,
            "remaining": max(0, limit - used) if limit > 0 else (-1 if limit == -1 else 0),
            "locked":    limit == 0,
            "unlimited": limit == -1,
        }

    # Boolean feature flags
    summary["flags"] = {
        "cv_refinement":    limits.get("cv_refinement", False),
        "recommended_jobs": limits.get("recommended_jobs", False),
        "extension_access": limits.get("extension_access", True),
    }
    summary["resumes_limit"]  = limits.get("resumes_limit", 1)
    summary["job_results_limit"] = limits.get("job_results_limit", 5)

    return summary


# ── Access enforcement ────────────────────────────────────────────────────────

def check_feature_access(user_id: str, feature: str) -> tuple[bool, dict | None]:
    """
    Returns (True, None) if access is granted.
    Returns (False, error_dict) if denied — caller should return jsonify(error), 403.
    """
    plan_id   = get_plan_id(user_id)
    limits    = get_plan_limits(plan_id)
    limit_key = FEATURE_LIMIT_KEYS.get(feature)

    if limit_key is None:
        # Unknown feature — fail open to avoid false lockouts
        print(f"[Subscription] Unknown feature '{feature}', allowing access")
        return True, None

    limit = limits.get(limit_key)

    if limit is None:
        return True, None   # key not in this plan dict — fail open

    label = FEATURE_LABELS.get(feature, feature)

    # Completely locked on this plan
    if limit == 0:
        return False, {
            "error":            f"{label.capitalize()} are not available on the {plan_id.capitalize()} plan.",
            "error_code":       "feature_locked",
            "upgrade_required": True,
            "current_plan":     plan_id,
        }

    # Unlimited
    if limit == -1:
        return True, None

    # Daily quota check
    used = get_today_usage(user_id, feature)
    if used >= limit:
        return False, {
            "error":            f"You've used all {limit} {label} for today. Resets at midnight.",
            "error_code":       "daily_limit_reached",
            "used":             used,
            "limit":            limit,
            "upgrade_required": True,
            "current_plan":     plan_id,
        }

    return True, None


def check_boolean_feature(user_id: str, flag: str) -> tuple[bool, dict | None]:
    """
    Check a boolean plan flag (cv_refinement, recommended_jobs, extension_access).
    """
    plan_id = get_plan_id(user_id)
    limits  = get_plan_limits(plan_id)

    if not limits.get(flag, False):
        return False, {
            "error":            f"This feature is not available on the {plan_id.capitalize()} plan.",
            "error_code":       "feature_locked",
            "upgrade_required": True,
            "current_plan":     plan_id,
        }
    return True, None


def check_cv_refinement_access(user_id: str) -> tuple[bool, dict | None]:
    return check_boolean_feature(user_id, "cv_refinement")


def check_recommended_jobs_access(user_id: str) -> tuple[bool, dict | None]:
    return check_boolean_feature(user_id, "recommended_jobs")


def get_job_results_limit(user_id: str) -> int:
    plan_id = get_plan_id(user_id)
    return get_plan_limits(plan_id).get("job_results_limit", 5)


def get_resumes_limit(user_id: str) -> int:
    plan_id = get_plan_id(user_id)
    return get_plan_limits(plan_id).get("resumes_limit", 1)


# ── Route decorator ───────────────────────────────────────────────────────────

def require_feature(feature: str):
    """
    Decorator — checks access BEFORE the route runs, increments usage AFTER
    a successful (2xx) response.

    Order matters — put BELOW @require_auth so g.user_id is set:

        @app.route("/api/analyze", methods=["POST"])
        @require_auth
        @require_feature("cv_analysis")
        def analyze():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            allowed, error = check_feature_access(g.user_id, feature)
            if not allowed:
                return jsonify(error), 403

            response = f(*args, **kwargs)

            # Increment only on success
            try:
                status = response[1] if isinstance(response, tuple) else 200
                if 200 <= int(status) < 300:
                    increment_usage(g.user_id, feature)
            except Exception:
                increment_usage(g.user_id, feature)

            return response
        return wrapper
    return decorator


def require_boolean_feature(flag: str):
    """
    Decorator for boolean plan flags (cv_refinement, recommended_jobs).

        @require_auth
        @require_boolean_feature("recommended_jobs")
        def recommend_jobs():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            allowed, error = check_boolean_feature(g.user_id, flag)
            if not allowed:
                return jsonify(error), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator