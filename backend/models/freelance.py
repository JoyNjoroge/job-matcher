"""
Freelance Lead model for opportunity discovery.
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Boolean, Text, Float, JSON
from database import db


class FreelanceLead(db.Model):
    """Freelance opportunity leads from social platforms."""
    
    __tablename__ = "freelance_leads"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    
    # Source Info
    platform = Column(String(50), nullable=False, index=True)  # linkedin, reddit, twitter
    author = Column(String(255), nullable=True)
    author_url = Column(String(1000), nullable=True)
    
    # Content
    content = Column(Text, nullable=False)
    original_url = Column(String(2000), nullable=True)
    
    # Analysis
    # Use JSON array for detected_skills for cross-db compatibility
    detected_skills = Column(JSON, default=list, nullable=False)
    confidence_score = Column(Float, default=0.0, nullable=False)
    
    # Contact
    contact_link = Column(String(1000), nullable=True)
    
    # Status (user-specific tracking stored separately or in a junction table)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    posted_at = Column(DateTime, nullable=True)
    discovered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "platform": self.platform,
            "author": self.author,
            "author_url": self.author_url,
            "content": self.content,
            "original_url": self.original_url,
            "detected_skills": self.detected_skills or [],
            "confidence_score": self.confidence_score,
            "contact_link": self.contact_link,
            "is_active": self.is_active,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
            "discovered_at": self.discovered_at.isoformat() if self.discovered_at else None,
        }


class UserSavedLead(db.Model):
    """User's saved freelance leads (junction table)."""
    
    __tablename__ = "user_saved_leads"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    lead_id = Column(String(36), nullable=False, index=True)
    
    # Status
    contacted = Column(Boolean, default=False, nullable=False)
    contacted_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    outreach_message = Column(Text, nullable=True)
    
    # Timestamps
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint("user_id", "lead_id", name="unique_user_lead"),
    )
