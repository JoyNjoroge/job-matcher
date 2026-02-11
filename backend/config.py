"""
Database and application configuration.
"""

import os
from datetime import timedelta


class Config:
    """Base configuration."""
    
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # Database (PostgreSQL only)
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is required. This backend is configured for PostgreSQL only.")
    if DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("SQLite is not supported. Please provide a PostgreSQL DATABASE_URL.")
    if not (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")):
        raise RuntimeError("Invalid DATABASE_URL scheme. Use a PostgreSQL URL (postgresql:// or postgres://).")

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    
    # JWT Settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_EXTENSION_TOKEN_EXPIRES = timedelta(minutes=30)
    
    # Gemini AI
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Job Search APIs
    JSEARCH_API_KEY = os.getenv("JSEARCH_API_KEY")
    ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
    ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
    SERPAPI_KEY = os.getenv("SERPAPI_KEY")


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
