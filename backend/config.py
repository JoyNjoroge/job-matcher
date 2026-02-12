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
    
    # Validate Supabase credentials
    if not SUPABASE_URL:
        raise RuntimeError(
            "SUPABASE_URL is required. "
            "Get it from your Supabase project settings: https://app.supabase.com/project/_/settings/api"
        )
    if not SUPABASE_ANON_KEY:
        raise RuntimeError(
            "SUPABASE_ANON_KEY is required. "
            "Get it from your Supabase project settings: https://app.supabase.com/project/_/settings/api"
        )
    
    # JWT Settings (keep your existing settings)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_EXTENSION_TOKEN_EXPIRES = timedelta(minutes=30)
    
    # Gemini AI (keep existing)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
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


def get_config():
    """Get configuration based on environment."""
    env = os.getenv("FLASK_ENV", "development")
    if env == "production":
        return ProductionConfig()
    return DevelopmentConfig()