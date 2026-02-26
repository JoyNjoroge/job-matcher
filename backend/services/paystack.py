"""
Paystack Payment Service - Subscription management for ApplyBot Pro.
Docs: https://paystack.com/docs/api
"""

import os
import hmac
import hashlib
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
PAYSTACK_BASE_URL   = "https://api.paystack.co"


PAYSTACK_PLAN_CODES = {
    "seeker": os.getenv("PAYSTACK_SEEKER_PLAN_CODE", ""),
    "pro":    os.getenv("PAYSTACK_PRO_PLAN_CODE",    ""),
}


# ── Low-level HTTP helper (no extra dependencies) ────────────────────────────

def _paystack_request(method: str, path: str, data: dict = None) -> dict:
    """Make an authenticated request to the Paystack API."""
    url     = f"{PAYSTACK_BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type":  "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req  = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[Paystack] {method} {path} → {e.code}: {body}")
        return {"status": False, "message": body}
    except Exception as e:
        print(f"[Paystack] request error: {e}")
        return {"status": False, "message": str(e)}


# ── Initialization ────────────────────────────────────────────────────────────

def initialize_payment(user_id: str, email: str, plan_id: str, callback_url: str) -> dict:
    """
    Initialize a Paystack transaction for a subscription plan.
    Returns the authorization_url to redirect the user to.
    """
    plan_code = PAYSTACK_PLAN_CODES.get(plan_id)
    if not plan_code:
        return {"error": f"No Paystack plan code configured for plan '{plan_id}'"}

    # Amount in kobo/pesewas/cents (Paystack uses smallest currency unit)
    amounts = {"seeker": 400 * 100, "pro": 900 * 100}  # USD * 100 for cents
    amount  = amounts.get(plan_id, 0)

    response = _paystack_request("POST", "/transaction/initialize", {
        "email":        email,
        "amount":       amount,
        "plan":         plan_code,
        "currency":     "USD",
        "callback_url": callback_url,
        "metadata": {
            "user_id": user_id,
            "plan_id": plan_id,
        },
    })

    if response.get("status"):
        return {
            "authorization_url": response["data"]["authorization_url"],
            "access_code":       response["data"]["access_code"],
            "reference":         response["data"]["reference"],
        }

    return {"error": response.get("message", "Failed to initialize payment")}


def verify_payment(reference: str) -> dict:
    """Verify a transaction by reference. Returns transaction data."""
    response = _paystack_request("GET", f"/transaction/verify/{reference}")
    if response.get("status") and response["data"]["status"] == "success":
        return {"success": True, "data": response["data"]}
    return {"success": False, "message": response.get("message", "Verification failed")}


def cancel_subscription(subscription_code: str) -> dict:
    """Cancel a Paystack subscription."""
    response = _paystack_request("POST", f"/subscription/disable", {
        "code":  subscription_code,
        "token": "",  # email token — handled via Paystack webhook in production
    })
    return {"success": response.get("status", False)}


# ── Webhook verification ──────────────────────────────────────────────────────

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify that a webhook actually came from Paystack.
    Always verify before processing any webhook event.
    """
    expected = hmac.new(
        PAYSTACK_SECRET_KEY.encode(),
        payload,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def handle_webhook_event(event: dict) -> dict:
    """
    Process a verified Paystack webhook event.
    Call this from your webhook route after signature verification.
    """
    event_type = event.get("event")
    data       = event.get("data", {})

    if event_type == "charge.success":
        return _handle_charge_success(data)

    if event_type == "subscription.disable":
        return _handle_subscription_cancelled(data)

    if event_type in ("invoice.payment_failed", "subscription.not_renew"):
        return _handle_payment_failed(data)

    print(f"[Paystack Webhook] Unhandled event: {event_type}")
    return {"handled": False, "event": event_type}


def _handle_charge_success(data: dict) -> dict:
    """Activate or upgrade subscription after successful payment."""
    try:
        from database import get_supabase
        meta    = data.get("metadata", {})
        user_id = meta.get("user_id")
        plan_id = meta.get("plan_id")

        if not user_id or not plan_id:
            return {"error": "Missing user_id or plan_id in metadata"}

        client = get_supabase()
        client.table("subscriptions").upsert({
            "user_id":  user_id,
            "plan_id":  plan_id,
            "status":   "active",
            "paystack_customer_id":        data.get("customer", {}).get("id"),
            "paystack_subscription_code":  data.get("subscription_code"),
            "current_period_start": datetime.utcnow().isoformat(),
            "current_period_end":   (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute()

        print(f"[Paystack] Subscription activated: user={user_id} plan={plan_id}")
        return {"handled": True, "action": "subscription_activated"}

    except Exception as e:
        print(f"[Paystack] charge.success handler error: {e}")
        return {"error": str(e)}


def _handle_subscription_cancelled(data: dict) -> dict:
    """Downgrade user to free when subscription is cancelled."""
    try:
        from database import get_supabase
        subscription_code = data.get("subscription_code")
        if not subscription_code:
            return {"error": "No subscription_code in event"}

        client = get_supabase()
        client.table("subscriptions").update({
            "plan_id":      "free",
            "status":       "cancelled",
            "cancelled_at": datetime.utcnow().isoformat(),
            "updated_at":   datetime.utcnow().isoformat(),
        }).eq("paystack_subscription_code", subscription_code).execute()

        return {"handled": True, "action": "subscription_cancelled"}
    except Exception as e:
        print(f"[Paystack] cancel handler error: {e}")
        return {"error": str(e)}


def _handle_payment_failed(data: dict) -> dict:
    """Mark subscription as past_due on failed payment."""
    try:
        from database import get_supabase
        subscription_code = data.get("subscription_code")
        if not subscription_code:
            return {"error": "No subscription_code"}

        client = get_supabase()
        client.table("subscriptions").update({
            "status":     "past_due",
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("paystack_subscription_code", subscription_code).execute()

        return {"handled": True, "action": "marked_past_due"}
    except Exception as e:
        print(f"[Paystack] payment failed handler error: {e}")
        return {"error": str(e)}
