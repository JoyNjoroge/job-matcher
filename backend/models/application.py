"""
Job Application model.
"""

import enum
from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Integer, Enum, JSON
from sqlalchemy.orm import relationship
from database import db


class ApplicationStatus(enum.Enum):
    """Job application status."""
    DRAFT = "draft"
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class JobApplication(db.Model):
    """Job application tracking."""
    
    __tablename__ = "job_applications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Job Info
    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=True)
    
    # Source
    source_url = Column(String(2000), nullable=True)
    source_platform = Column(String(100), nullable=True)  # linkedin, indeed, glassdoor, etc.
    
    # Status
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT, nullable=False, index=True)
    
    # Analysis results (cached from the configured AI provider)
    fit_score = Column(Integer, nullable=True)
    interview_likelihood = Column(String(20), nullable=True)  # low, medium, high
    analysis_json = Column(JSON, default=dict, nullable=False)
    # Structure: {
    #   "strengths": [...],
    #   "gaps": [...],
    #   "red_flags": [...],
    #   "missing_skills": [...],
    #   "resume_suggestions": [...],
    #   "keyword_changes": [...],
    #   "warnings": [...]
    # }
    
    # Resume used for this application
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    
    # Extension Tracking
    tracked_by_extension = Column(Boolean, default=False, nullable=False)
    
    # Interview Prep
    selected_for_interview = Column(Boolean, default=False, nullable=False)
    interview_prep_json = Column(JSON, nullable=True)
    # Structure: {
    #   "questions": [{"question": str, "what_they_test": str, "talking_points": [...]}]
    # }
    
    # Timestamps
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="applications")
    cover_letters = relationship("CoverLetter", back_populates="application", cascade="all, delete-orphan")
    resume = relationship("Resume", foreign_keys=[resume_id])
    
    def mark_applied(self):
        """Mark application as submitted."""
        self.status = ApplicationStatus.APPLIED
        self.applied_at = datetime.utcnow()
    
    def to_dict(self, include_analysis=True):
        """Convert to dictionary."""
        data = {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "job_title": self.job_title,
            "company": self.company,
            "location": self.location,
            "source_url": self.source_url,
            "source_platform": self.source_platform,
            "status": self.status.value if self.status else None,
            "fit_score": self.fit_score,
            "interview_likelihood": self.interview_likelihood,
            "tracked_by_extension": self.tracked_by_extension,
            "selected_for_interview": self.selected_for_interview,
            "applied_at": self.applied_at.isoformat() if self.applied_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_analysis:
            data["analysis"] = self.analysis_json or {}
            data["interview_prep"] = self.interview_prep_json
        return data
