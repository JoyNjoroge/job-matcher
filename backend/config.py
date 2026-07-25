"""
Database and application configuration.
STEP 2: Updated config.py for Supabase migration
"""

import os
from datetime import timedelta


class Config:
    """Base configuration."""
    
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # Supabase Configuration (NEW)
    SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
    
    # Validate Supabase credentials
    if not SUPABASE_URL:
        raise RuntimeError(
            "SUPABASE_URL is required. "
            "Get it from your Supabase project settings: https://app.supabase.com/project/_/settings/api"
        )
    if not SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY (production) or SUPABASE_ANON_KEY (development) is required. "
            "Get it from your Supabase project settings: https://app.supabase.com/project/_/settings/api"
        )
    
    # JWT Settings (keep your existing settings)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_EXTENSION_TOKEN_EXPIRES = timedelta(minutes=30)
    
    # AI provider (OpenRouter's free router by default)
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")
    
    # Job Search APIs (keep existing)
    JSEARCH_API_KEY = os.getenv("JSEARCH_API_KEY")
    ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
    ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
    SERPAPI_KEY = os.getenv("SERPAPI_KEY")
    
    # CORS (optional - add if needed)
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    @classmethod
    def validate(cls):
        required = {
            "SECRET_KEY": cls.SECRET_KEY,
            "JWT_SECRET_KEY": cls.JWT_SECRET_KEY,
            "SUPABASE_URL": cls.SUPABASE_URL,
            "SUPABASE_SERVICE_ROLE_KEY": cls.SUPABASE_SERVICE_ROLE_KEY,
            "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID", ""),
            "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET", ""),
            "LINKEDIN_CLIENT_ID": os.getenv("LINKEDIN_CLIENT_ID", ""),
            "LINKEDIN_CLIENT_SECRET": os.getenv("LINKEDIN_CLIENT_SECRET", ""),
            "PAYSTACK_SECRET_KEY": os.getenv("PAYSTACK_SECRET_KEY", ""),
            "PAYSTACK_SEEKER_PLAN_CODE": os.getenv("PAYSTACK_SEEKER_PLAN_CODE", ""),
            "PAYSTACK_PRO_PLAN_CODE": os.getenv("PAYSTACK_PRO_PLAN_CODE", ""),
        }
        insecure_defaults = {
            "dev-secret-key-change-in-production",
            "jwt-secret-change-in-production",
            "change-me",
        }
        missing = [name for name, value in required.items() if not value]
        secret_names = {
            "SECRET_KEY",
            "JWT_SECRET_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "GOOGLE_CLIENT_SECRET",
            "LINKEDIN_CLIENT_SECRET",
            "PAYSTACK_SECRET_KEY",
        }
        missing.extend(
            name for name in secret_names
            if required.get(name) in insecure_defaults
            or len(required.get(name, "")) < 24
        )
        missing = sorted(set(missing))
        if missing:
            raise RuntimeError(
                "Production configuration is missing secure values for: "
                + ", ".join(missing)
            )
        if not os.getenv("OPENROUTER_API_KEY"):
            raise RuntimeError("Production configuration requires OPENROUTER_API_KEY")


def get_config():
    """Get configuration based on environment."""
    env = os.getenv("FLASK_ENV", "development")
    if env == "production":
        ProductionConfig.validate()
        return ProductionConfig()
    return DevelopmentConfig()
