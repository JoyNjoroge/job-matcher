"""
Profile, Resume, Application, CoverLetter, Freelance model helpers for Supabase.
"""

from datetime import datetime
from uuid import uuid4
import enum


# ============================================================================
# USER PROFILE
# ============================================================================
class UserProfile:
    """Helper class for UserProfile operations with Supabase."""
    
    @staticmethod
    def create_new(user_id: str, **kwargs) -> dict:
        """Create a new profile dict ready for Supabase insert."""
        return {
            "id": str(uuid4()),
            "user_id": user_id,
            "full_name": kwargs.get("full_name"),
            "phone": kwargs.get("phone"),
            "location": kwargs.get("location"),
            "address_line1": kwargs.get("address_line1"),
            "address_line2": kwargs.get("address_line2"),
            "city": kwargs.get("city"),
            "state": kwargs.get("state"),
            "postal_code": kwargs.get("postal_code"),
            "country": kwargs.get("country"),
            "job_titles": kwargs.get("job_titles", []),
            "skills": kwargs.get("skills", []),
            "experience_level": kwargs.get("experience_level"),
            "linkedin_url": kwargs.get("linkedin_url"),
            "github_url": kwargs.get("github_url"),
            "portfolio_url": kwargs.get("portfolio_url"),
            "summary": kwargs.get("summary"),
            "education": kwargs.get("education", []),
            "work_experience": kwargs.get("work_experience", []),
            "certifications": kwargs.get("certifications", []),
            "projects": kwargs.get("projects", []),
            "tools": kwargs.get("tools", []),
            "languages": kwargs.get("languages", []),
            "awards": kwargs.get("awards", []),
            "volunteer_experience": kwargs.get("volunteer_experience", []),
            "publications": kwargs.get("publications", []),
            "courses": kwargs.get("courses", []),
            "interests": kwargs.get("interests", []),
            "additional_details": kwargs.get("additional_details", {}),
            "years_of_experience": kwargs.get("years_of_experience"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    
    @staticmethod
    def to_dict(profile_data: dict) -> dict:
        """Convert Supabase row to API response format."""
        return {
            "id": str(profile_data.get("id")),
            "user_id": str(profile_data.get("user_id")),
            "full_name": profile_data.get("full_name"),
            "phone": profile_data.get("phone"),
            "location": profile_data.get("location"),
            "address_line1": profile_data.get("address_line1"),
            "address_line2": profile_data.get("address_line2"),
            "city": profile_data.get("city"),
            "state": profile_data.get("state"),
            "postal_code": profile_data.get("postal_code"),
            "country": profile_data.get("country"),
            "job_titles": profile_data.get("job_titles", []),
            "skills": profile_data.get("skills", []),
            "experience_level": profile_data.get("experience_level"),
            "linkedin_url": profile_data.get("linkedin_url"),
            "github_url": profile_data.get("github_url"),
            "portfolio_url": profile_data.get("portfolio_url"),
            "summary": profile_data.get("summary"),
            "education": profile_data.get("education") or [],
            "work_experience": profile_data.get("work_experience") or [],
            "certifications": profile_data.get("certifications") or [],
            "projects": profile_data.get("projects") or [],
            "tools": profile_data.get("tools") or [],
            "languages": profile_data.get("languages") or [],
            "awards": profile_data.get("awards") or [],
            "volunteer_experience": profile_data.get("volunteer_experience") or [],
            "publications": profile_data.get("publications") or [],
            "courses": profile_data.get("courses") or [],
            "interests": profile_data.get("interests") or [],
            "additional_details": profile_data.get("additional_details") or {},
            "years_of_experience": profile_data.get("years_of_experience"),
            "created_at": profile_data.get("created_at"),
            "updated_at": profile_data.get("updated_at"),
        }


# ============================================================================
# RESUME
# ============================================================================
class Resume:
    """Helper class for Resume operations with Supabase."""
    
    @staticmethod
    def create_new(user_id: str, **kwargs) -> dict:
        """Create a new resume dict ready for Supabase insert."""
        return {
            "id": str(uuid4()),
            "user_id": user_id,
            "original_file_url": kwargs.get("original_file_url"),
            "original_filename": kwargs.get("original_filename"),
            "file_type": kwargs.get("file_type"),
            "raw_text": kwargs.get("raw_text"),
            "parsed_json": kwargs.get("parsed_json", {}),
            "embedding_vector": kwargs.get("embedding_vector"),
            "is_primary": kwargs.get("is_primary", False),
            "title": kwargs.get("title"),
            "source": kwargs.get("source", "upload"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    
    @staticmethod
    def to_dict(resume_data: dict, include_raw: bool = False) -> dict:
        """Convert Supabase row to API response format."""
        data = {
            "id": str(resume_data.get("id")),
            "user_id": str(resume_data.get("user_id")),
            "original_filename": resume_data.get("original_filename"),
            "file_type": resume_data.get("file_type"),
            "parsed_json": resume_data.get("parsed_json", {}),
            "is_primary": resume_data.get("is_primary", False),
            "title": resume_data.get("title"),
            "source": resume_data.get("source"),
            "created_at": resume_data.get("created_at"),
            "updated_at": resume_data.get("updated_at"),
        }
        if include_raw:
            data["raw_text"] = resume_data.get("raw_text")
        return data


# ============================================================================
# JOB APPLICATION
# ============================================================================
class ApplicationStatus(enum.Enum):
    """Job application status."""
    DRAFT = "draft"
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class JobApplication:
    """Helper class for JobApplication operations with Supabase."""
    
    @staticmethod
    def create_new(user_id: str, job_title: str, company: str, **kwargs) -> dict:
        """Create a new application dict ready for Supabase insert."""
        return {
            "id": str(uuid4()),
            "user_id": user_id,
            "job_title": job_title,
            "company": company,
            "location": kwargs.get("location"),
            "job_description": kwargs.get("job_description"),
            "source_url": kwargs.get("source_url"),
            "source_platform": kwargs.get("source_platform"),
            "status": ApplicationStatus.DRAFT.value,
            "fit_score": kwargs.get("fit_score"),
            "interview_likelihood": kwargs.get("interview_likelihood"),
            "analysis_json": kwargs.get("analysis_json", {}),
            "resume_id": kwargs.get("resume_id"),
            "tracked_by_extension": kwargs.get("tracked_by_extension", False),
            "selected_for_interview": kwargs.get("selected_for_interview", False),
            "interview_prep_json": kwargs.get("interview_prep_json"),
            "applied_at": kwargs.get("applied_at"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    
    @staticmethod
    def mark_applied(application_data: dict) -> dict:
        """Mark application as submitted."""
        return {
            "status": ApplicationStatus.APPLIED.value,
            "applied_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    
    @staticmethod
    def to_dict(application_data: dict, include_analysis: bool = True) -> dict:
        """Convert Supabase row to API response format."""
        data = {
            "id": str(application_data.get("id")),
            "user_id": str(application_data.get("user_id")),
            "job_title": application_data.get("job_title"),
            "company": application_data.get("company"),
            "location": application_data.get("location"),
            "source_url": application_data.get("source_url"),
            "source_platform": application_data.get("source_platform"),
            "status": application_data.get("status"),
            "fit_score": application_data.get("fit_score"),
            "interview_likelihood": application_data.get("interview_likelihood"),
            "tracked_by_extension": application_data.get("tracked_by_extension"),
            "selected_for_interview": application_data.get("selected_for_interview"),
            "applied_at": application_data.get("applied_at"),
            "created_at": application_data.get("created_at"),
            "updated_at": application_data.get("updated_at"),
        }
        if include_analysis:
            data["analysis"] = application_data.get("analysis_json", {})
            data["interview_prep"] = application_data.get("interview_prep_json")
        return data


# ============================================================================
# COVER LETTER
# ============================================================================
class CoverLetter:
    """Helper class for CoverLetter operations with Supabase."""
    
    @staticmethod
    def create_new(user_id: str, content: str, **kwargs) -> dict:
        """Create a new cover letter dict ready for Supabase insert."""
        return {
            "id": str(uuid4()),
            "user_id": user_id,
            "job_application_id": kwargs.get("job_application_id"),
            "title": kwargs.get("title"),
            "content": content,
            "generated_by_ai": kwargs.get("generated_by_ai", False),
            "version": kwargs.get("version", "1.0"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    
    @staticmethod
    def to_dict(cover_letter_data: dict) -> dict:
        """Convert Supabase row to API response format."""
        return {
            "id": str(cover_letter_data.get("id")),
            "user_id": str(cover_letter_data.get("user_id")),
            "job_application_id": str(cover_letter_data.get("job_application_id")) if cover_letter_data.get("job_application_id") else None,
            "title": cover_letter_data.get("title"),
            "content": cover_letter_data.get("content"),
            "generated_by_ai": cover_letter_data.get("generated_by_ai", False),
            "version": cover_letter_data.get("version"),
            "created_at": cover_letter_data.get("created_at"),
            "updated_at": cover_letter_data.get("updated_at"),
        }


# ============================================================================
# FREELANCE LEAD
# ============================================================================
class FreelanceLead:
    """Helper class for FreelanceLead operations with Supabase."""
    
    @staticmethod
    def create_new(platform: str, content: str, **kwargs) -> dict:
        """Create a new freelance lead dict ready for Supabase insert."""
        return {
            "id": str(uuid4()),
            "platform": platform,
            "author": kwargs.get("author"),
            "author_url": kwargs.get("author_url"),
            "content": content,
            "original_url": kwargs.get("original_url"),
            "detected_skills": kwargs.get("detected_skills", []),
            "confidence_score": kwargs.get("confidence_score", 0.0),
            "contact_link": kwargs.get("contact_link"),
            "is_active": kwargs.get("is_active", True),
            "posted_at": kwargs.get("posted_at"),
            "discovered_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
        }
    
    @staticmethod
    def to_dict(lead_data: dict) -> dict:
        """Convert Supabase row to API response format."""
        return {
            "id": str(lead_data.get("id")),
            "platform": lead_data.get("platform"),
            "author": lead_data.get("author"),
            "author_url": lead_data.get("author_url"),
            "content": lead_data.get("content"),
            "original_url": lead_data.get("original_url"),
            "detected_skills": lead_data.get("detected_skills", []),
            "confidence_score": lead_data.get("confidence_score", 0.0),
            "contact_link": lead_data.get("contact_link"),
            "is_active": lead_data.get("is_active", True),
            "posted_at": lead_data.get("posted_at"),
            "discovered_at": lead_data.get("discovered_at"),
        }
