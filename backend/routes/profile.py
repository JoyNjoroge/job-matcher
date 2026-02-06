"""
User Profile routes - Profile management endpoints with auto-fill from resume/LinkedIn.
"""

from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
import os

from database import db
from models import UserProfile, Resume
from services.auth import require_auth
from services.parser import parse_resume_file, use_gemini_for_parsing
from services.gemini import extract_profile_from_linkedin

profile_bp = Blueprint("profile", __name__)

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@profile_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    """
    Get current user's profile.
    
    Returns:
        - profile: UserProfile object
    """
    try:
        profile = UserProfile.query.filter_by(user_id=g.user_id).first()
        
        if not profile:
            # Create empty profile if doesn't exist
            profile = UserProfile(user_id=g.user_id)
            db.session.add(profile)
            db.session.commit()
        
        return jsonify({"profile": profile.to_dict()})
        
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({"error": "Failed to get profile"}), 500


@profile_bp.route("/profile", methods=["PUT", "PATCH"])
@require_auth
def update_profile():
    """
    Update current user's profile.
    
    Body (all optional):
        - full_name: str
        - phone: str
        - location: str
        - job_titles: list[str]
        - skills: list[str]
        - experience_level: str
        - linkedin_url: str
        - github_url: str
        - portfolio_url: str
        - summary: str
    
    Returns:
        - profile: Updated UserProfile object
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        profile = UserProfile.query.filter_by(user_id=g.user_id).first()
        
        if not profile:
            profile = UserProfile(user_id=g.user_id)
            db.session.add(profile)
        
        # Update allowed fields
        allowed_fields = [
            "full_name", "phone", "location", "job_titles", "skills",
            "experience_level", "linkedin_url", "github_url", "portfolio_url", "summary"
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(profile, field, data[field])
        
        db.session.commit()
        
        return jsonify({"profile": profile.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        print(f"Update profile error: {e}")
        return jsonify({"error": "Failed to update profile"}), 500


@profile_bp.route("/profile/parse-resume", methods=["POST"])
@require_auth
def parse_resume_for_profile():
    """
    Upload and parse resume to auto-fill profile.
    
    Form Data:
        - file: Resume file (PDF, DOCX, TXT)
        - auto_apply: bool (optional, default False) - automatically apply parsed data to profile
    
    Returns:
        - parsed_data: Extracted profile information
        - profile: Updated profile (if auto_apply=True)
    """
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # Get file extension
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        original_filename = secure_filename(file.filename)
        
        print(f"[PARSE-RESUME] Parsing {file.filename} for user {g.user_id}")
        
        # Parse the resume file
        raw_text = parse_resume_file(file, file_ext)
        
        if not raw_text:
            return jsonify({"error": "Failed to extract text from resume"}), 400
        
        print(f"[PARSE-RESUME] Extracted {len(raw_text)} characters")
        
        # Use Gemini AI to structure the data
        parsed_data = use_gemini_for_parsing(raw_text)
        
        print(f"[PARSE-RESUME] Parsed data: {parsed_data}")
        
        # Check if auto_apply is requested
        auto_apply = request.form.get('auto_apply', 'false').lower() == 'true'
        
        # CRITICAL: Always create/update Resume record for briefing to work
        resume = Resume.query.filter_by(user_id=g.user_id, is_primary=True).first()
        
        if not resume:
            resume = Resume(
                user_id=g.user_id,
                is_primary=True,
                source="upload"
            )
            db.session.add(resume)
        
        # Update resume data
        resume.raw_text = raw_text
        resume.original_filename = original_filename
        resume.file_type = file_ext
        resume.parsed_json = parsed_data
        resume.title = f"{parsed_data.get('full_name', 'My')} Resume" if parsed_data.get('full_name') else "My Resume"
        
        if auto_apply:
            profile = UserProfile.query.filter_by(user_id=g.user_id).first()
            
            if not profile:
                profile = UserProfile(user_id=g.user_id)
                db.session.add(profile)
            
            # Auto-fill profile with parsed data
            if parsed_data.get('full_name') and not profile.full_name:
                profile.full_name = parsed_data['full_name']
            
            if parsed_data.get('phone') and not profile.phone:
                profile.phone = parsed_data['phone']
            
            if parsed_data.get('location') and not profile.location:
                profile.location = parsed_data['location']
            
            if parsed_data.get('skills'):
                # Merge with existing skills
                existing_skills = set(profile.skills or [])
                new_skills = set(parsed_data['skills'])
                profile.skills = list(existing_skills | new_skills)
            
            if parsed_data.get('experience_level') and not profile.experience_level:
                profile.experience_level = parsed_data['experience_level']
            
            if parsed_data.get('summary') and not profile.summary:
                profile.summary = parsed_data['summary']
            
            # Extract job titles from experience
            if parsed_data.get('experience'):
                job_titles = [exp.get('title') for exp in parsed_data['experience'] if exp.get('title')]
                if job_titles:
                    existing_titles = set(profile.job_titles or [])
                    profile.job_titles = list(existing_titles | set(job_titles))
            elif parsed_data.get('job_titles'):
                # Use job_titles directly if available
                existing_titles = set(profile.job_titles or [])
                profile.job_titles = list(existing_titles | set(parsed_data['job_titles']))
        
        db.session.commit()
        
        response_data = {
            "parsed_data": parsed_data,
            "message": "Resume parsed and saved successfully"
        }
        
        if auto_apply:
            profile = UserProfile.query.filter_by(user_id=g.user_id).first()
            response_data["profile"] = profile.to_dict() if profile else None
            response_data["message"] = "Profile updated successfully"
        
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"[PARSE-RESUME] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to parse resume"}), 500


@profile_bp.route("/profile/parse-linkedin", methods=["POST"])
@require_auth
def parse_linkedin_for_profile():
    """
    Parse LinkedIn profile URL to auto-fill profile.
    
    Body:
        - linkedin_url: str (required)
        - auto_apply: bool (optional, default False)
    
    Returns:
        - parsed_data: Extracted profile information
        - profile: Updated profile (if auto_apply=True)
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('linkedin_url'):
            return jsonify({"error": "LinkedIn URL is required"}), 400
        
        linkedin_url = data.get('linkedin_url').strip()
        auto_apply = data.get('auto_apply', False)
        
        print(f"[PARSE-LINKEDIN] Parsing {linkedin_url} for user {g.user_id}")
        
        # Use Gemini to extract data from LinkedIn URL
        parsed_data = extract_profile_from_linkedin(linkedin_url)
        
        if not parsed_data:
            return jsonify({
                "error": "Failed to parse LinkedIn profile. Please try uploading a resume instead."
            }), 400
        
        print(f"[PARSE-LINKEDIN] Parsed data: {parsed_data}")
        
        # Create/update Resume record from LinkedIn data
        resume = Resume.query.filter_by(user_id=g.user_id, is_primary=True).first()
        
        if not resume:
            resume = Resume(
                user_id=g.user_id,
                is_primary=True,
                source="linkedin"
            )
            db.session.add(resume)
        
        # Build raw text from parsed data for analysis
        raw_text_parts = []
        if parsed_data.get('full_name'):
            raw_text_parts.append(f"Name: {parsed_data['full_name']}")
        if parsed_data.get('summary'):
            raw_text_parts.append(f"Summary: {parsed_data['summary']}")
        if parsed_data.get('experience'):
            raw_text_parts.append("Experience:")
            for exp in parsed_data['experience']:
                raw_text_parts.append(f"- {exp.get('title', '')} at {exp.get('company', '')}")
        if parsed_data.get('skills'):
            raw_text_parts.append(f"Skills: {', '.join(parsed_data['skills'])}")
        
        resume.raw_text = "\n".join(raw_text_parts)
        resume.parsed_json = parsed_data
        resume.title = f"{parsed_data.get('full_name', 'LinkedIn')} Profile"
        resume.source = "linkedin"
        
        if auto_apply:
            profile = UserProfile.query.filter_by(user_id=g.user_id).first()
            
            if not profile:
                profile = UserProfile(user_id=g.user_id)
                db.session.add(profile)
            
            # Auto-fill profile with parsed data
            if parsed_data.get('full_name'):
                profile.full_name = parsed_data['full_name']
            
            if parsed_data.get('location'):
                profile.location = parsed_data['location']
            
            if parsed_data.get('summary'):
                profile.summary = parsed_data['summary']
            
            if parsed_data.get('skills'):
                existing_skills = set(profile.skills or [])
                new_skills = set(parsed_data['skills'])
                profile.skills = list(existing_skills | new_skills)
            
            if parsed_data.get('job_titles'):
                existing_titles = set(profile.job_titles or [])
                new_titles = set(parsed_data['job_titles'])
                profile.job_titles = list(existing_titles | new_titles)
            
            if parsed_data.get('experience_level'):
                profile.experience_level = parsed_data['experience_level']
            
            profile.linkedin_url = linkedin_url
        
        db.session.commit()
        
        response_data = {
            "parsed_data": parsed_data,
            "message": "LinkedIn profile parsed and saved successfully"
        }
        
        if auto_apply:
            profile = UserProfile.query.filter_by(user_id=g.user_id).first()
            response_data["profile"] = profile.to_dict() if profile else None
            response_data["message"] = "Profile updated successfully from LinkedIn"
        
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"[PARSE-LINKEDIN] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to parse LinkedIn profile"}), 500


@profile_bp.route("/profile/onboarding", methods=["POST"])
@require_auth
def complete_onboarding():
    """
    Mark onboarding as complete and update profile.
    
    Body:
        - full_name: str (required)
        - job_titles: list[str]
        - skills: list[str]
        - experience_level: str
    
    Returns:
        - user: Updated user object
        - profile: Updated profile object
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        if not data.get("full_name"):
            return jsonify({"error": "Full name is required"}), 400
        
        from models import User
        user = User.query.get(g.user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Update profile
        profile = UserProfile.query.filter_by(user_id=g.user_id).first()
        if not profile:
            profile = UserProfile(user_id=g.user_id)
            db.session.add(profile)
        
        profile.full_name = data.get("full_name")
        profile.job_titles = data.get("job_titles", [])
        profile.skills = data.get("skills", [])
        profile.experience_level = data.get("experience_level")
        profile.location = data.get("location")
        profile.linkedin_url = data.get("linkedin_url")
        
        # Mark onboarding complete
        user.onboarding_completed = True
        
        db.session.commit()
        
        return jsonify({
            "user": user.to_dict(),
            "profile": profile.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Onboarding error: {e}")
        return jsonify({"error": "Failed to complete onboarding"}), 500