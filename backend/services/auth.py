"""
Authentication service - JWT token management.
"""

import os
from datetime import datetime, timedelta
from functools import wraps
from uuid import UUID

import jwt
from flask import request, jsonify, g

from config import get_config

config = get_config()


def generate_access_token(user_id: str, email: str) -> str:
    """Generate JWT access token."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "access",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + config.JWT_ACCESS_TOKEN_EXPIRES,
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm="HS256")


def generate_refresh_token(user_id: str) -> str:
    """Generate JWT refresh token."""
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + config.JWT_REFRESH_TOKEN_EXPIRES,
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm="HS256")


def generate_extension_token(user_id: str) -> str:
    """Generate short-lived token for browser extension."""
    payload = {
        "sub": str(user_id),
        "type": "extension",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + config.JWT_EXTENSION_TOKEN_EXPIRES,
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")


def get_token_from_header() -> str:
    """Extract token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header:
        raise ValueError("Authorization header missing")
    
    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise ValueError("Invalid authorization header format")
    
    return parts[1]


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            token = get_token_from_header()
            payload = decode_token(token)
            
            if payload.get("type") not in ["access", "extension"]:
                return jsonify({"error": "Invalid token type"}), 401
            
            # Store user info in flask g object
            g.user_id = UUID(payload["sub"])
            g.user_email = payload.get("email")
            
            return f(*args, **kwargs)
            
        except ValueError as e:
            return jsonify({"error": str(e)}), 401
        except Exception as e:
            return jsonify({"error": "Authentication failed"}), 401
    
    return decorated


def require_refresh_token(f):
    """Decorator to require refresh token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            token = get_token_from_header()
            payload = decode_token(token)
            
            if payload.get("type") != "refresh":
                return jsonify({"error": "Refresh token required"}), 401
            
            g.user_id = UUID(payload["sub"])
            
            return f(*args, **kwargs)
            
        except ValueError as e:
            return jsonify({"error": str(e)}), 401
        except Exception as e:
            return jsonify({"error": "Authentication failed"}), 401
    
    return decorated
