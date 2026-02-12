"""
User model helper for Supabase.
No SQLAlchemy - just helper functions for working with user data.
"""

import enum
from datetime import datetime
from uuid import uuid4
import bcrypt


class RoleType(enum.Enum):
    """User role types."""
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"


class User:
    """Helper class for User operations with Supabase."""
    
    @staticmethod
    def create_new(email: str, password: str) -> dict:
        """Create a new user dict ready for Supabase insert."""
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
        
        return {
            "id": str(uuid4()),
            "email": email.strip().lower(),
            "password_hash": password_hash,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": None,
            "onboarding_completed": False,
            "is_active": True,
        }
    
    @staticmethod
    def check_password(user_data: dict, password: str) -> bool:
        """Verify password against stored hash."""
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"),
                user_data["password_hash"].encode("utf-8")
            )
        except Exception as e:
            print(f"Password check error: {e}")
            return False
    
    @staticmethod
    def update_last_login(user_id: str) -> dict:
        """Get update dict for last login timestamp."""
        return {
            "last_login": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def to_dict(user_data: dict) -> dict:
        """Convert Supabase row to API response format."""
        return {
            "id": str(user_data.get("id")),
            "email": user_data.get("email"),
            "created_at": user_data.get("created_at"),
            "last_login": user_data.get("last_login"),
            "onboarding_completed": user_data.get("onboarding_completed", False),
            "is_active": user_data.get("is_active", True),
        }


class UserRole:
    """Helper class for UserRole operations with Supabase."""
    
    @staticmethod
    def create_new(user_id: str, role: RoleType) -> dict:
        """Create a new user role dict."""
        return {
            "id": str(uuid4()),
            "user_id": user_id,
            "role": role.value,
            "created_at": datetime.utcnow().isoformat(),
        }
    
    @staticmethod
    def has_role(user_roles: list, role: RoleType) -> bool:
        """Check if user has a specific role."""
        return any(r.get("role") == role.value for r in user_roles)
