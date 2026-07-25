"""
Subscription routes - Plan info, upgrades, billing, usage, webhooks.
"""

from flask import Blueprint, request, jsonify, g
from services.auth import require_auth
from services.subscription import (
    get_user_subscription,
    get_usage_summary,
    get_plan_limits,
    PLAN_LIMITS,
)
from services.paystack import (
    initialize_payment,
    verify_payment,
    verify_webhook_signature,
    handle_webhook_event,
)
import os

subscription_bp = Blueprint("subscription", __name__)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://candorapply.joynjoroge.site",
).rstrip("/")


# ── Plans ─────────────────────────────────────────────────────────────────────

@subscription_bp.route("/plans", methods=["GET"])
def get_plans():
    """Public endpoint — return all available plans."""
    plans = [
        {
            "id":    "free",
            "name":  "Free",
            "price": 0,
            "limits": PLAN_LIMITS["free"],
            "features": [
                "3 CV analyses per day",
                "5 job results per search",
                "1 resume stored",
                "Unlimited interview prep",
            ],
        },
        {
            "id":    "seeker",
            "name":  "Seeker",
            "price": 4,
            "limits": PLAN_LIMITS["seeker"],
            "features": [
                "20 CV analyses per day",
                "All job results",
                "10 cover letters per day",
                "3 resumes stored",
                "CV refinement",
                "Unlimited interview prep",
            ],
        },
        {
            "id":    "pro",
            "name":  "Pro",
            "price": 9,
            "limits": PLAN_LIMITS["pro"],
            "features": [
                "Unlimited CV analyses",
                "All job results",
                "Unlimited cover letters",
                "10 resumes stored",
                "CV refinement",
                "Priority support",
            ],
        },
    ]
    return jsonify({"plans": plans})


# ── Current subscription & usage ──────────────────────────────────────────────

@subscription_bp.route("/subscription", methods=["GET"])
@require_auth
def get_subscription():
    """Return the user's current plan + today's usage counters."""
    sub   = get_user_subscription(g.user_id)
    usage = get_usage_summary(g.user_id)
    return jsonify({
        "subscription": {
            "plan_id":   sub.get("plan_id", "free"),
            "status":    sub.get("status", "active"),
            "period_end": sub.get("current_period_end"),
        },
        "usage": usage,
    })


# ── Upgrade / checkout ────────────────────────────────────────────────────────

@subscription_bp.route("/subscription/checkout", methods=["POST"])
@require_auth
def create_checkout():
    """Initialize a Paystack payment for a plan upgrade."""
    data    = request.get_json()
    plan_id = data.get("plan_id")

    if plan_id not in ("seeker", "pro"):
        return jsonify({"error": "Invalid plan. Choose 'seeker' or 'pro'"}), 400

    from database import get_db_helper
    db   = get_db_helper()
    user = db.get_user_by_id(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    callback_url = f"{FRONTEND_URL}/billing/callback"
    result = initialize_payment(
        user_id=g.user_id,
        email=user["email"],
        plan_id=plan_id,
        callback_url=callback_url,
    )

    if "error" in result:
        return jsonify({"error": result["error"]}), 500

    return jsonify(result)


# ── Payment callback (verify after redirect) ──────────────────────────────────

@subscription_bp.route("/subscription/verify", methods=["GET"])
@require_auth
def verify_callback():
    """Verify a payment after Paystack redirects back to the frontend."""
    reference = request.args.get("reference")
    if not reference:
        return jsonify({"error": "No reference provided"}), 400

    result = verify_payment(reference)
    if result.get("success"):
        return jsonify({"status": "success", "message": "Payment verified successfully"})

    return jsonify({"status": "failed", "message": result.get("message", "Verification failed")}), 400


# ── Webhook ───────────────────────────────────────────────────────────────────

@subscription_bp.route("/subscription/webhook", methods=["POST"])
def paystack_webhook():
    """
    Paystack webhook endpoint.
    Add this URL in your Paystack dashboard:
    https://yourdomain.com/api/subscription/webhook
    """
    payload   = request.get_data()
    signature = request.headers.get("x-paystack-signature", "")

    if not verify_webhook_signature(payload, signature):
        return jsonify({"error": "Invalid signature"}), 401

    try:
        event  = request.get_json()
        result = handle_webhook_event(event)
        return jsonify({"received": True, "result": result})
    except Exception as e:
        print(f"[Webhook] Error: {e}")
        return jsonify({"error": str(e)}), 500


# ── Cancel subscription ───────────────────────────────────────────────────────

@subscription_bp.route("/subscription/cancel", methods=["POST"])
@require_auth
def cancel_sub():
    """Cancel the user's current subscription (downgrades to free)."""
    from services.paystack import cancel_subscription
    from database import get_supabase

    client = get_supabase()
    result = client.table("subscriptions").select("paystack_subscription_code").eq("user_id", g.user_id).single().execute()

    if not result.data or not result.data.get("paystack_subscription_code"):
        return jsonify({"error": "No active subscription found"}), 404

    cancel_result = cancel_subscription(result.data["paystack_subscription_code"])
    if cancel_result.get("success"):
        return jsonify({"message": "Subscription cancelled. You'll keep access until the end of your billing period."})

    return jsonify({"error": "Failed to cancel subscription"}), 500
