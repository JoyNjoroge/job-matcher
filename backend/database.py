"""
Database initialization and session management.
SUPABASE VERSION - No SQLAlchemy
"""

import os
from supabase import create_client, Client
from typing import Optional

# Initialize Supabase client
supabase: Optional[Client] = None


def init_db(app):
    """Initialize Supabase client with Flask app."""
    global supabase
    
    # Get config from app
    supabase_url = app.config.get('SUPABASE_URL')
    supabase_key = app.config.get('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        raise RuntimeError(
            "Supabase credentials missing. "
            "Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment."
        )
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Successfully connected to Supabase")
    except Exception as e:
        raise RuntimeError(
            f"Failed to initialize Supabase client: {str(e)}"
        ) from e
    
    return supabase


def get_supabase() -> Client:
    """Get Supabase client instance."""
    global supabase
    
    if supabase is None:
        raise RuntimeError("Supabase not initialized. Call init_db() first.")
    
    return supabase


# Database helper class for common operations
class Database:
    """Helper class for database operations."""
    
    def __init__(self):
        self.client = get_supabase()
    
    # User operations
    def get_user_by_id(self, user_id: str):
        """Get user by ID."""
        response = self.client.table('users').select('*').eq('id', user_id).execute()
        return response.data[0] if response.data else None
    
    def get_user_by_email(self, email: str):
        """Get user by email."""
        response = self.client.table('users').select('*').eq('email', email).execute()
        return response.data[0] if response.data else None
    
    def create_user(self, user_data: dict):
        """Create new user."""
        response = self.client.table('users').insert(user_data).execute()
        return response.data[0] if response.data else None
    
    def update_user(self, user_id: str, user_data: dict):
        """Update user."""
        response = self.client.table('users').update(user_data).eq('id', user_id).execute()
        return response.data[0] if response.data else None
    
    # Profile operations
    def get_profile(self, user_id: str):
        """Get user profile."""
        response = self.client.table('user_profiles').select('*').eq('user_id', user_id).execute()
        return response.data[0] if response.data else None
    
    def create_profile(self, profile_data: dict):
        """Create user profile."""
        response = self.client.table('user_profiles').insert(profile_data).execute()
        return response.data[0] if response.data else None
    
    def update_profile(self, user_id: str, profile_data: dict):
        """Update user profile."""
        response = self.client.table('user_profiles').update(profile_data).eq('user_id', user_id).execute()
        return response.data[0] if response.data else None
    
    # Resume operations
    def get_resumes(self, user_id: str):
        """Get user resumes."""
        response = self.client.table('resumes').select('*').eq('user_id', user_id).execute()
        return response.data
    
    def get_resume_by_id(self, resume_id: str):
        """Get resume by ID."""
        response = self.client.table('resumes').select('*').eq('id', resume_id).execute()
        return response.data[0] if response.data else None
    
    def create_resume(self, resume_data: dict):
        """Create resume."""
        response = self.client.table('resumes').insert(resume_data).execute()
        return response.data[0] if response.data else None
    
    def update_resume(self, resume_id: str, resume_data: dict):
        """Update resume."""
        response = self.client.table('resumes').update(resume_data).eq('id', resume_id).execute()
        return response.data[0] if response.data else None
    
    def delete_resume(self, resume_id: str):
        """Delete resume."""
        response = self.client.table('resumes').delete().eq('id', resume_id).execute()
        return response.data
    
    # Application operations
    def get_applications(self, user_id: str):
        """Get user applications."""
        response = (
            self.client.table('job_applications')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', desc=True)
            .execute()
        )
        return response.data
    
    def get_application_by_id(self, application_id: str):
        """Get application by ID."""
        response = self.client.table('job_applications').select('*').eq('id', application_id).execute()
        return response.data[0] if response.data else None
    
    def create_application(self, application_data: dict):
        """Create application."""
        response = self.client.table('job_applications').insert(application_data).execute()
        return response.data[0] if response.data else None
    
    def update_application(self, application_id: str, application_data: dict):
        """Update application."""
        response = self.client.table('job_applications').update(application_data).eq('id', application_id).execute()
        return response.data[0] if response.data else None
    
    # Cover letter operations
    def get_cover_letters(self, user_id: str):
        """Get user cover letters."""
        response = self.client.table('cover_letters').select('*').eq('user_id', user_id).execute()
        return response.data
    
    def create_cover_letter(self, cover_letter_data: dict):
        """Create cover letter."""
        response = self.client.table('cover_letters').insert(cover_letter_data).execute()
        return response.data[0] if response.data else None
    
    # Freelance operations
    def get_freelance_leads(self, user_id: str):
        """Get freelance leads."""
        response = self.client.table('freelance_leads').select('*').eq('user_id', user_id).execute()
        return response.data
    
    def create_freelance_lead(self, lead_data: dict):
        """Create freelance lead."""
        response = self.client.table('freelance_leads').insert(lead_data).execute()
        return response.data[0] if response.data else None


# Create a global database instance
# This will be initialized after init_db() is called
db_helper = None

def get_db_helper():
    """Get database helper instance."""
    global db_helper
    if db_helper is None:
        db_helper = Database()
    return db_helper
