"""
User profile model.
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Numeric
from sqlalchemy.orm import relationship
from database import db


class UserProfile(db.Model):
    """Extended user profile information."""
    
    __tablename__ = "user_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Basic Info
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    
    # Professional Info
    # Use JSON arrays for job titles and skills to support multiple DB backends
    job_titles = Column(JSON, default=list, nullable=False)
    skills = Column(JSON, default=list, nullable=False)
    experience_level = Column(String(50), nullable=True)  # entry, mid, senior, lead, executive
    
    # Social Links
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    
    # Bio
    summary = Column(Text, nullable=True)
    education = Column(JSON, default=list, nullable=False)
    work_experience = Column(JSON, default=list, nullable=False)
    certifications = Column(JSON, default=list, nullable=False)
    projects = Column(JSON, default=list, nullable=False)
    tools = Column(JSON, default=list, nullable=False)
    languages = Column(JSON, default=list, nullable=False)
    awards = Column(JSON, default=list, nullable=False)
    volunteer_experience = Column(JSON, default=list, nullable=False)
    publications = Column(JSON, default=list, nullable=False)
    courses = Column(JSON, default=list, nullable=False)
    interests = Column(JSON, default=list, nullable=False)
    additional_details = Column(JSON, default=dict, nullable=False)
    years_of_experience = Column(Numeric, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "full_name": self.full_name,
            "phone": self.phone,
            "location": self.location,
            "job_titles": self.job_titles or [],
            "skills": self.skills or [],
            "experience_level": self.experience_level,
            "linkedin_url": self.linkedin_url,
            "github_url": self.github_url,
            "portfolio_url": self.portfolio_url,
            "summary": self.summary,
            "education": self.education or [],
            "work_experience": self.work_experience or [],
            "certifications": self.certifications or [],
            "projects": self.projects or [],
            "tools": self.tools or [],
            "languages": self.languages or [],
            "awards": self.awards or [],
            "volunteer_experience": self.volunteer_experience or [],
            "publications": self.publications or [],
            "courses": self.courses or [],
            "interests": self.interests or [],
            "additional_details": self.additional_details or {},
            "years_of_experience": (
                float(self.years_of_experience)
                if self.years_of_experience is not None else None
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
