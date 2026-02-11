"""
Database initialization and session management.
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.exc import SQLAlchemyError


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


db = SQLAlchemy(model_class=Base)


def init_db(app):
    """Initialize database with Flask app."""
    db.init_app(app)
    
    with app.app_context():
        # Import models to register them
        from models import User, UserProfile, Resume, JobApplication, CoverLetter, FreelanceLead, UserRole
        
        # Create all tables
        try:
            db.create_all()
        except SQLAlchemyError as exc:
            raise RuntimeError(
                "Database connection failed while initializing PostgreSQL. "
                "Check DATABASE_URL, ensure your Postgres/Supabase instance is running and reachable, "
                "and verify credentials/network access."
            ) from exc
        
    return db
