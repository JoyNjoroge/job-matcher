"""
OAuth routes — add these to auth.py (or a separate oauth.py Blueprint).

Prerequisites (pip install):
    pip install authlib requests --break-system-packages

Environment variables needed:
    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
    LINKEDIN_CLIENT_ID
    LINKEDIN_CLIENT_SECRET
    FRONTEND_URL            (e.g. https://candorapply.joynjoroge.site)
    OAUTH_REDIRECT_BASE     (e.g. https://candorapply-backend.joynjoroge.site/api)

How it works:
  1. Frontend clicks "Continue with Google" → redirects to /api/auth/google
  2. /api/auth/google redirects user to Google consent screen
  3. Google redirects back to /api/auth/google/callback
  4. Callback exchanges code → access token → user info
  5. We upsert the user in our DB and generate our own JWT pair
  6. We redirect user back to the frontend with tokens in query params
  7. Frontend reads tokens from URL, stores them, clears URL
"""

import os
import secrets
import requests
from flask import Blueprint, redirect, request, jsonify, url_for
from authlib.integrations.flask_client import OAuth

from database import get_db_helper
from models import User, UserProfile, UserRole, RoleType
from services.auth import generate_access_token, generate_refresh_token

# ── Blueprint & OAuth client setup ───────────────────────────────────────────
oauth_bp = Blueprint("oauth", __name__)
oauth    = OAuth()   # call oauth.init_app(app) in your app factory

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://candorapply.joynjoroge.site")
OAUTH_REDIRECT_BASE = os.getenv(
    "OAUTH_REDIRECT_BASE",
    "https://candorapply-backend.joynjoroge.site/api",
)

# ── Google OAuth ──────────────────────────────────────────────────────────────
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# ── LinkedIn OAuth ─────────────────────────────────────────────────────────────
oauth.register(
    name="linkedin",
    client_id=os.getenv("LINKEDIN_CLIENT_ID"),
    client_secret=os.getenv("LINKEDIN_CLIENT_SECRET"),
    access_token_url="https://www.linkedin.com/oauth/v2/accessToken",
    authorize_url="https://www.linkedin.com/oauth/v2/authorization",
    api_base_url="https://api.linkedin.com/v2/",
    client_kwargs={"scope": "r_liteprofile r_emailaddress"},
)


# ── Shared helper: upsert OAuth user and return tokens ───────────────────────

def _upsert_oauth_user(email: str, full_name: str, provider: str) -> dict:
    """
    Find or create a user by email. OAuth users have no password hash.
    Returns { access_token, refresh_token }.
    """
    db = get_db_helper()

    user = db.get_user_by_email(email)

    if not user:
        # New user — create account
        user_data = {
            **User.create_new(email, secrets.token_hex(24)),  # random unusable password
            "full_name":     full_name,
            "auth_provider": provider,   # "google" | "linkedin"
            "is_active":     True,
        }
        user = db.create_user(user_data)

        # Create blank profile
        profile_data = UserProfile.create_new(user["id"])
        profile_data["full_name"] = full_name
        db.create_profile(profile_data)

        # Assign default role
        db.client.table("user_roles").insert(
            UserRole.create_new(user["id"], RoleType.USER)
        ).execute()
    else:
        # Existing user — update provider tag if missing
        if not user.get("auth_provider"):
            db.update_user(user["id"], {"auth_provider": provider})

    access_token  = generate_access_token(str(user["id"]), user["email"])
    refresh_token = generate_refresh_token(str(user["id"]))

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user":          User.to_dict(user),
    }


def _redirect_to_frontend(tokens: dict, error: str | None = None) -> str:
    """
    Redirect browser back to frontend after OAuth.
    Tokens are passed as query params; the frontend stores them and strips the URL.
    """
    if error:
        return redirect(f"{FRONTEND_URL}/login?oauth_error={error}")

    return redirect(
        f"{FRONTEND_URL}/oauth-callback"
        f"?access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
    )


# ── Google routes ─────────────────────────────────────────────────────────────

@oauth_bp.route("/auth/google")
def google_login():
    """Redirect user to Google consent screen."""
    redirect_uri = f"{OAUTH_REDIRECT_BASE}/auth/google/callback"
    return oauth.google.authorize_redirect(redirect_uri)


@oauth_bp.route("/auth/google/callback")
def google_callback():
    """Handle Google OAuth callback."""
    try:
        token     = oauth.google.authorize_access_token()
        user_info = token.get("userinfo") or oauth.google.userinfo()

        email     = user_info.get("email", "").lower().strip()
        full_name = user_info.get("name", email.split("@")[0])

        if not email:
            return _redirect_to_frontend(None, "no_email")

        tokens = _upsert_oauth_user(email, full_name, "google")
        return _redirect_to_frontend(tokens)

    except Exception as e:
        print(f"[OAuth/Google] Callback error: {e}")
        import traceback; traceback.print_exc()
        return _redirect_to_frontend(None, "google_failed")


# ── LinkedIn routes ───────────────────────────────────────────────────────────

@oauth_bp.route("/auth/linkedin")
def linkedin_login():
    """Redirect user to LinkedIn consent screen."""
    redirect_uri = f"{OAUTH_REDIRECT_BASE}/auth/linkedin/callback"
    return oauth.linkedin.authorize_redirect(redirect_uri)


@oauth_bp.route("/auth/linkedin/callback")
def linkedin_callback():
    """Handle LinkedIn OAuth callback."""
    try:
        token       = oauth.linkedin.authorize_access_token()
        access_tok  = token["access_token"]

        # Fetch profile
        headers = {"Authorization": f"Bearer {access_tok}"}

        profile_resp = requests.get(
            "https://api.linkedin.com/v2/me"
            "?projection=(id,localizedFirstName,localizedLastName)",
            headers=headers,
            timeout=10,
        )
        profile_resp.raise_for_status()
        profile_data = profile_resp.json()

        first = profile_data.get("localizedFirstName", "")
        last  = profile_data.get("localizedLastName",  "")
        full_name = f"{first} {last}".strip() or "LinkedIn User"

        # Fetch primary email
        email_resp = requests.get(
            "https://api.linkedin.com/v2/emailAddress"
            "?q=members&projection=(elements*(handle~))",
            headers=headers,
            timeout=10,
        )
        email_resp.raise_for_status()
        email_data = email_resp.json()

        email = (
            email_data
            .get("elements", [{}])[0]
            .get("handle~", {})
            .get("emailAddress", "")
            .lower()
            .strip()
        )

        if not email:
            return _redirect_to_frontend(None, "no_email")

        tokens = _upsert_oauth_user(email, full_name, "linkedin")
        return _redirect_to_frontend(tokens)

    except Exception as e:
        print(f"[OAuth/LinkedIn] Callback error: {e}")
        import traceback; traceback.print_exc()
        return _redirect_to_frontend(None, "linkedin_failed")


# ─────────────────────────────────────────────────────────────────────────────
# FRONTEND: OAuthCallbackPage.tsx
# Add this route to App.tsx: <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
#
# // src/pages/OAuthCallbackPage.tsx
# import { useEffect } from "react";
# import { useNavigate } from "react-router-dom";
# import { useAuth } from "@/contexts/AuthContext";
#
# export default function OAuthCallbackPage() {
#   const navigate = useNavigate();
#   const { loadFromTokens } = useAuth(); // add this helper to AuthContext (see below)
#
#   useEffect(() => {
#     const params = new URLSearchParams(window.location.search);
#     const access  = params.get("access_token");
#     const refresh = params.get("refresh_token");
#     const error   = params.get("oauth_error");
#
#     // Always clean URL immediately
#     window.history.replaceState({}, "", "/");
#
#     if (error || !access) {
#       navigate("/login?error=" + (error || "oauth_failed"));
#       return;
#     }
#
#     // Store tokens and load user (add loadFromTokens to AuthContext)
#     localStorage.setItem("access_token",  access);
#     localStorage.setItem("refresh_token", refresh || "");
#     loadFromTokens(access, refresh || "").then(() => navigate("/"));
#   }, []);
#
#   return (
#     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
#       <p style={{ color: "#6B7280" }}>Signing you in…</p>
#     </div>
#   );
# }
# ─────────────────────────────────────────────────────────────────────────────
#
# ADD TO AuthContext.tsx:
#
# const loadFromTokens = async (access: string, refresh: string) => {
#   setTokens(access, refresh);
#   await loadCurrentUser(access);
# };
# // and expose it in the context value
# ─────────────────────────────────────────────────────────────────────────────
#
# ADD TO app factory (app.py / main.py):
#
# from oauth_routes import oauth_bp, oauth
# oauth.init_app(app)
# app.register_blueprint(oauth_bp, url_prefix="/api")
# ─────────────────────────────────────────────────────────────────────────────
