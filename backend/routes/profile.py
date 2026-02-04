"""
User Profile routes - Profile management endpoints.
"""

from flask import Blueprint, request, jsonify, g

from database import db
from models import UserProfile
from services.auth import require_auth

profile_bp = Blueprint("profile", __name__)


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
