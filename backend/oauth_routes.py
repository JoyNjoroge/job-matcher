"""
OAuth routes — Google & LinkedIn via Authlib.

pip install authlib requests --break-system-packages

Environment variables needed:
    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
    LINKEDIN_CLIENT_ID
    LINKEDIN_CLIENT_SECRET
    FRONTEND_URL            (e.g. https://candorapply.joynjoroge.site)
    OAUTH_REDIRECT_BASE     (e.g. https://candorapply-backend.joynjoroge.site/api)
    FLASK_SECRET_KEY        (any random string — needed for OAuth state cookie)
"""

import os
import secrets
import requests
from flask import Blueprint, redirect, request, jsonify
from authlib.integrations.flask_client import OAuth

from database import get_db_helper
from models import User, UserProfile, UserRole, RoleType
from services.auth import generate_access_token, generate_refresh_token

oauth_bp = Blueprint("oauth", __name__)
oauth    = OAuth()

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://candorapply.joynjoroge.site")
OAUTH_REDIRECT_BASE = os.getenv(
    "OAUTH_REDIRECT_BASE",
    "https://candorapply-backend.joynjoroge.site/api",
)

# ── Google ────────────────────────────────────────────────────────────────────
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
    access_token_url="https://oauth2.googleapis.com/token",
    client_kwargs={"scope": "openid email profile"},
)

# ── LinkedIn ──────────────────────────────────────────────────────────────────
oauth.register(
    name="linkedin",
    client_id=os.getenv("LINKEDIN_CLIENT_ID"),
    client_secret=os.getenv("LINKEDIN_CLIENT_SECRET"),
    access_token_url="https://www.linkedin.com/oauth/v2/accessToken",
    authorize_url="https://www.linkedin.com/oauth/v2/authorization",
    userinfo_endpoint="https://api.linkedin.com/v2/me",
    api_base_url="https://api.linkedin.com/v2/",
    client_kwargs={"scope": "openid profile email"},
)


# ── Shared helper ─────────────────────────────────────────────────────────────

def _upsert_oauth_user(email: str, full_name: str, provider: str) -> dict:
    db   = get_db_helper()
    user = db.get_user_by_email(email)

    if not user:
        user_data = {
            **User.create_new(email, secrets.token_hex(24)),
            "full_name":     full_name,
            "auth_provider": provider,
            "is_active":     True,
        }
        user = db.create_user(user_data)

        profile_data              = UserProfile.create_new(user["id"])
        profile_data["full_name"] = full_name
        db.create_profile(profile_data)

        db.client.table("user_roles").insert(
            UserRole.create_new(user["id"], RoleType.USER)
        ).execute()
    else:
        if not user.get("auth_provider"):
            db.update_user(user["id"], {"auth_provider": provider})

    return {
        "access_token":  generate_access_token(str(user["id"]), user["email"]),
        "refresh_token": generate_refresh_token(str(user["id"])),
    }


def _redirect_to_frontend(tokens: dict | None = None, error: str | None = None):
    """
    Redirect back to the frontend after OAuth.
    Success → /auth/callback?access_token=...&refresh_token=...
    Failure → /login?oauth_error=...
    """
    if error or not tokens:
        return redirect(f"{FRONTEND_URL}/login?oauth_error={error or 'unknown'}")

    return redirect(
        f"{FRONTEND_URL}/auth/callback"
        f"?access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
    )


# ── Google routes ─────────────────────────────────────────────────────────────

@oauth_bp.route("/auth/google")
def google_login():
    redirect_uri = f"{OAUTH_REDIRECT_BASE}/auth/google/callback"
    return oauth.google.authorize_redirect(redirect_uri)


@oauth_bp.route("/auth/google/callback")
def google_callback():
    try:
        token     = oauth.google.authorize_access_token()
        user_info = token.get("userinfo") or oauth.google.userinfo()
        email     = user_info.get("email", "").lower().strip()
        full_name = user_info.get("name", email.split("@")[0])

        if not email:
            return _redirect_to_frontend(error="no_email")

        tokens = _upsert_oauth_user(email, full_name, "google")
        return _redirect_to_frontend(tokens)

    except Exception as e:
        print(f"[OAuth/Google] {e}")
        import traceback; traceback.print_exc()
        return _redirect_to_frontend(error="google_failed")


# ── LinkedIn routes ───────────────────────────────────────────────────────────

@oauth_bp.route("/auth/linkedin")
def linkedin_login():
    redirect_uri = f"{OAUTH_REDIRECT_BASE}/auth/linkedin/callback"
    return oauth.linkedin.authorize_redirect(redirect_uri)


@oauth_bp.route("/auth/linkedin/callback")
def linkedin_callback():
    try:
        token      = oauth.linkedin.authorize_access_token()
        access_tok = token["access_token"]
        headers    = {"Authorization": f"Bearer {access_tok}"}

        # Fetch profile
        profile_resp = requests.get(
            "https://api.linkedin.com/v2/me",
            headers=headers, timeout=10,
        )
        profile_resp.raise_for_status()
        p = profile_resp.json()
        first_name = p.get("localizedFirstName", "")
        last_name = p.get("localizedLastName", "")
        full_name = f"{first_name} {last_name}".strip() or "LinkedIn User"

        # Fetch email
        email_resp = requests.get(
            "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
            headers=headers, timeout=10,
        )
        email_resp.raise_for_status()
        email = (
            email_resp.json()
            .get("elements", [{}])[0]
            .get("handle~", {})
            .get("emailAddress", "")
            .lower().strip()
        )

        if not email:
            return _redirect_to_frontend(error="no_email")

        tokens = _upsert_oauth_user(email, full_name, "linkedin")
        return _redirect_to_frontend(tokens)

    except Exception as e:
        print(f"[OAuth/LinkedIn] {e}")
        import traceback; traceback.print_exc()
        return _redirect_to_frontend(error="linkedin_failed")
