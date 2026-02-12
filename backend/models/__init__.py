"""
Database models for ApplyBot Pro - Supabase version.
These are helper classes, not SQLAlchemy models.
"""

from .user import User, UserRole, RoleType
from .helpers import (
    UserProfile,
    Resume,
    JobApplication,
    ApplicationStatus,
    CoverLetter,
    FreelanceLead,
)

__all__ = [
    "User",
    "UserRole",
    "RoleType",
    "UserProfile",
    "Resume",
    "JobApplication",
    "ApplicationStatus",
    "CoverLetter",
    "FreelanceLead",
]
