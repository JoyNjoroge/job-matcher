"""
Cover Letter model.
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import db


class CoverLetter(db.Model):
    """Cover letter storage."""
    
    __tablename__ = "cover_letters"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_application_id = Column(String(36), ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=True)
    
    # Content
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    
    # Metadata
    generated_by_ai = Column(Boolean, default=False, nullable=False)
    version = Column(String(50), default="1.0", nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="cover_letters")
    application = relationship("JobApplication", back_populates="cover_letters")
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "job_application_id": str(self.job_application_id) if self.job_application_id else None,
            "title": self.title,
            "content": self.content,
            "generated_by_ai": self.generated_by_ai,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
