"""Profile routes - UPDATED FOR SUPABASE"""
from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
from database import get_db_helper
from models import UserProfile, Resume
from services.auth import require_auth
from services.parser import parse_resume_file, use_ai_for_parsing
from datetime import datetime

profile_bp = Blueprint("profile", __name__)

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def profile_schema_error_response(error):
    """Return an actionable response when Supabase is missing profile columns."""
    message = str(error).lower()
    structured_columns = (
        "education", "work_experience", "certifications", "projects", "tools",
        "languages", "awards", "volunteer_experience", "publications",
        "courses", "interests", "additional_details", "years_of_experience",
    )
    missing_column = (
        ("column" in message or "schema cache" in message)
        and any(column in message for column in structured_columns)
    )
    if missing_column:
        return jsonify({
            "error": (
                "Supabase is missing the structured profile columns. "
                "Run backend/migrations/002_structured_profile.sql in the "
                "Supabase SQL Editor, then try saving again."
            ),
            "error_code": "profile_schema_migration_required",
        }), 503
    return None

@profile_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    try:
        db = get_db_helper()
        profile = db.get_profile(g.user_id)
        
        if not profile:
            profile_data = UserProfile.create_new(g.user_id)
            profile = db.create_profile(profile_data)
        
        return jsonify({"profile": UserProfile.to_dict(profile)})
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({"error": "Failed to get profile"}), 500

@profile_bp.route("/profile", methods=["PUT", "PATCH"])
@require_auth
def update_profile():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        db = get_db_helper()
        profile = db.get_profile(g.user_id)
        
        if not profile:
            profile_data = UserProfile.create_new(g.user_id)
            db.create_profile(profile_data)
        
        allowed_fields = [
            "full_name", "phone", "location", "job_titles", "skills",
            "experience_level", "linkedin_url", "github_url", "portfolio_url", "summary",
            "education", "work_experience", "certifications", "projects", "tools",
            "languages", "awards", "volunteer_experience", "publications",
            "courses", "interests", "additional_details", "years_of_experience",
        ]
        
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        result = db.update_profile(g.user_id, update_data)
        return jsonify({"profile": UserProfile.to_dict(result)})
    except Exception as e:
        print(f"Update profile error: {e}")
        schema_error = profile_schema_error_response(e)
        if schema_error:
            return schema_error
        return jsonify({"error": "Failed to update profile"}), 500

@profile_bp.route("/profile/parse-resume", methods=["POST"])
@require_auth
def parse_resume_for_profile():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file"}), 400
        
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        original_filename = secure_filename(file.filename)
        
        raw_text = parse_resume_file(file, file_ext)
        if not raw_text:
            return jsonify({"error": "Failed to extract text"}), 400
        
        parsed_data = use_ai_for_parsing(raw_text)
        auto_apply = request.form.get('auto_apply', 'false').lower() == 'true'
        
        db = get_db_helper()
        
        # Save/update resume
        resume = db.client.table('resumes').select('*').eq('user_id', g.user_id).eq('is_primary', True).execute()
        
        resume_data = Resume.create_new(
            user_id=g.user_id,
            raw_text=raw_text,
            original_filename=original_filename,
            file_type=file_ext,
            parsed_json=parsed_data,
            title=f"{parsed_data.get('full_name', 'My')} Resume",
            is_primary=True,
            source="upload"
        )
        
        if resume.data:
            db.client.table('resumes').update(resume_data).eq('id', resume.data[0]['id']).execute()
        else:
            db.client.table('resumes').insert(resume_data).execute()
        
        response_data = {"parsed_data": parsed_data, "message": "Resume parsed successfully"}
        
        if auto_apply:
            profile = db.get_profile(g.user_id)
            if not profile:
                profile_data = UserProfile.create_new(g.user_id)
                db.create_profile(profile_data)
                profile = profile_data
            
            update_data = {"updated_at": datetime.utcnow().isoformat()}
            for field in ['full_name', 'phone', 'location', 'summary', 'experience_level']:
                if parsed_data.get(field) and not profile.get(field):
                    update_data[field] = parsed_data[field]
            
            if parsed_data.get('skills'):
                existing = set(profile.get('skills', []))
                update_data['skills'] = list(existing | set(parsed_data['skills']))
            
            if parsed_data.get('job_titles'):
                existing = set(profile.get('job_titles', []))
                update_data['job_titles'] = list(existing | set(parsed_data['job_titles']))

            structured_fields = [
                'education', 'work_experience', 'certifications', 'projects',
                'tools', 'languages', 'awards', 'volunteer_experience',
                'publications', 'courses', 'interests', 'additional_details',
                'years_of_experience',
            ]
            for field in structured_fields:
                if parsed_data.get(field) and not profile.get(field):
                    update_data[field] = parsed_data[field]
            
            updated_profile = db.update_profile(g.user_id, update_data)
            response_data["profile"] = UserProfile.to_dict(updated_profile)
            response_data["message"] = "Profile updated successfully"
        
        return jsonify(response_data)
    except Exception as e:
        print(f"Parse resume error: {e}")
        import traceback
        traceback.print_exc()
        schema_error = profile_schema_error_response(e)
        if schema_error:
            return schema_error
        return jsonify({"error": "Failed to parse resume"}), 500

@profile_bp.route("/profile/onboarding", methods=["POST"])
@require_auth
def complete_onboarding():
    try:
        data = request.get_json()
        if not data or not data.get("full_name"):
            return jsonify({"error": "Full name is required"}), 400
        
        db = get_db_helper()
        profile = db.get_profile(g.user_id)
        
        if not profile:
            profile_data = UserProfile.create_new(g.user_id)
            db.create_profile(profile_data)
        
        update_data = {
            "full_name": data.get("full_name"),
            "job_titles": data.get("job_titles", []),
            "skills": data.get("skills", []),
            "experience_level": data.get("experience_level"),
            "location": data.get("location"),
            "linkedin_url": data.get("linkedin_url"),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        updated_profile = db.update_profile(g.user_id, update_data)
        db.update_user(g.user_id, {"onboarding_completed": True})
        
        user = db.get_user_by_id(g.user_id)
        
        return jsonify({
            "user": User.to_dict(user),
            "profile": UserProfile.to_dict(updated_profile)
        })
    except Exception as e:
        print(f"Onboarding error: {e}")
        return jsonify({"error": "Failed to complete onboarding"}), 500
