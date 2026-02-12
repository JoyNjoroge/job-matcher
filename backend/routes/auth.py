"""
Authentication routes - Login, Register, Token management.
UPDATED FOR SUPABASE - No SQLAlchemy
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime

from database import get_db_helper
from models import User, UserProfile, UserRole, RoleType
from services.auth import (
    generate_access_token,
    generate_refresh_token,
    generate_extension_token,
    require_auth,
    require_refresh_token,
)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.
    
    Body:
        - email: str (required)
        - password: str (required, min 8 chars)
    
    Returns:
        - user: User object
        - access_token: JWT access token
        - refresh_token: JWT refresh token
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        # Validation
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        if "@" not in email or "." not in email:
            return jsonify({"error": "Invalid email format"}), 400
        
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        
        db = get_db_helper()
        
        # Check if user exists
        existing = db.get_user_by_email(email)
        if existing:
            return jsonify({"error": "Email already registered"}), 409
        
        # Create user
        user_data = User.create_new(email, password)
        user = db.create_user(user_data)
        
        if not user:
            return jsonify({"error": "Failed to create user"}), 500
        
        # Create empty profile
        profile_data = UserProfile.create_new(user["id"])
        db.create_profile(profile_data)
        
        # Assign default user role
        role_data = UserRole.create_new(user["id"], RoleType.USER)
        db.client.table('user_roles').insert(role_data).execute()
        
        # Generate tokens
        access_token = generate_access_token(str(user["id"]), user["email"])
        refresh_token = generate_refresh_token(str(user["id"]))
        
        return jsonify({
            "user": User.to_dict(user),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Registration failed"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Login with email and password.
    
    Body:
        - email: str
        - password: str
    
    Returns:
        - user: User object
        - access_token: JWT access token
        - refresh_token: JWT refresh token
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        
        db = get_db_helper()
        
        # Find user
        user = db.get_user_by_email(email)
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Verify password
        password_valid = User.check_password(user, password)
        
        if not password_valid:
            return jsonify({"error": "Invalid email or password"}), 401
        
        if not user.get("is_active"):
            return jsonify({"error": "Account is deactivated"}), 403
        
        # Update last login
        update_data = User.update_last_login(user["id"])
        db.update_user(user["id"], update_data)
        
        # Generate tokens
        access_token = generate_access_token(str(user["id"]), user["email"])
        refresh_token = generate_refresh_token(str(user["id"]))
        
        return jsonify({
            "user": User.to_dict(user),
            "access_token": access_token,
            "refresh_token": refresh_token,
        })
        
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Login failed"}), 500


@auth_bp.route("/refresh", methods=["POST"])
@require_refresh_token
def refresh_tokens():
    """
    Refresh access token using refresh token.
    
    Headers:
        - Authorization: Bearer <refresh_token>
    
    Returns:
        - access_token: New JWT access token
        - refresh_token: New JWT refresh token
    """
    try:
        db = get_db_helper()
        user = db.get_user_by_id(g.user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if not user.get("is_active"):
            return jsonify({"error": "Account is deactivated"}), 403
        
        access_token = generate_access_token(str(user["id"]), user["email"])
        refresh_token = generate_refresh_token(str(user["id"]))
        
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
        })
        
    except Exception as e:
        print(f"Token refresh error: {e}")
        return jsonify({"error": "Token refresh failed"}), 500


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    """
    Get current authenticated user.
    
    Returns:
        - user: User object with profile
    """
    try:
        db = get_db_helper()
        user = db.get_user_by_id(g.user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_data = User.to_dict(user)
        
        # Get profile
        profile = db.get_profile(g.user_id)
        if profile:
            user_data["profile"] = UserProfile.to_dict(profile)
        
        return jsonify({"user": user_data})
        
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({"error": "Failed to get user"}), 500


@auth_bp.route("/extension-login", methods=["POST"])
@require_auth
def extension_login():
    """
    Generate short-lived token for browser extension.
    
    Headers:
        - Authorization: Bearer <access_token>
    
    Returns:
        - extension_token: Short-lived JWT for extension
    """
    try:
        extension_token = generate_extension_token(str(g.user_id))
        
        return jsonify({
            "extension_token": extension_token,
            "expires_in": 1800,  # 30 minutes in seconds
        })
        
    except Exception as e:
        print(f"Extension login error: {e}")
        return jsonify({"error": "Failed to generate extension token"}), 500


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    """
    Logout current user.
    
    Note: With JWT, actual invalidation requires a token blacklist.
    This endpoint is mainly for client-side cleanup confirmation.
    """
    return jsonify({"message": "Logged out successfully"})
