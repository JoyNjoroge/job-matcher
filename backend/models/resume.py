"""
Resume model for CV storage and parsing.
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from database import db


class Resume(db.Model):
    """User resume/CV storage."""
    
    __tablename__ = "resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # File Storage
    original_file_url = Column(String(1000), nullable=True)
    original_filename = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)  # pdf, docx, etc.
    
    # Raw Content
    raw_text = Column(Text, nullable=True)
    
    # Parsed Structured Data
    parsed_json = Column(JSONB, default=dict, nullable=False)
    # Structure: {
    #   "education": [...],
    #   "experience": [...],
    #   "skills": [...],
    #   "projects": [...],
    #   "tools": [...],
    #   "certifications": [...],
    #   "years_of_experience": int,
    #   "seniority_estimation": str
    # }
    
    # Embedding for semantic search (stored as array of floats)
    embedding_vector = Column(ARRAY(db.Float), nullable=True)
    
    # Metadata
    is_primary = Column(Boolean, default=False, nullable=False)
    title = Column(String(255), nullable=True)  # User-friendly name like "Software Engineer Resume"
    
    # Source
    source = Column(String(50), default="upload", nullable=False)  # upload, linkedin, manual
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    
    def to_dict(self, include_raw=False):
        """Convert to dictionary."""
        data = {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "original_filename": self.original_filename,
            "file_type": self.file_type,
            "parsed_json": self.parsed_json or {},
            "is_primary": self.is_primary,
            "title": self.title,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_raw:
            data["raw_text"] = self.raw_text
        return data
