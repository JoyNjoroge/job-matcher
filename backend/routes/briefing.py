"""
Apply briefing routes - Pre-application fit analysis
"""

from flask import Blueprint, request, jsonify, g
from database import db
from models import User, UserProfile, Resume
from services.auth import require_auth
from services.gemini import analyze_job_fit_for_briefing
from services.parser import parse_resume_file
import os

apply_briefing_bp = Blueprint("apply_briefing", __name__)


@apply_briefing_bp.route("/apply/analyze-fit", methods=["POST"])
@require_auth
def analyze_fit():
    """
    Analyze job fit before application.
    
    Form Data:
        - job_id: str
        - job_description: str
        - resume: File (optional)
        - use_profile_resume: bool (if true, uses profile resume)
    
    Returns:
        - fit_score: int (0-100)
        - recommendation: str (strong_fit, good_fit, fair_fit, poor_fit)
        - strengths: list[str]
        - gaps: list[str]
        - skill_recommendations: list[str]
        - experience_match: str
        - message: str
        - should_apply: bool
    """
    try:
        job_id = request.form.get("job_id")
        job_description = request.form.get("job_description")
        use_profile_resume = request.form.get("use_profile_resume") == "true"
        
        if not job_description:
            return jsonify({"error": "Job description is required"}), 400
        
        # Get resume text
        resume_text = ""
        
        if use_profile_resume:
            # Try to get resume from Resume model first
            resume = Resume.query.filter_by(user_id=g.user_id, is_primary=True).first()
            
            if resume and resume.raw_text:
                resume_text = resume.raw_text
            else:
                # Fallback: Try to build resume from profile
                profile = UserProfile.query.filter_by(user_id=g.user_id).first()
                
                if not profile:
                    return jsonify({
                        "error": "No resume found in profile. Please upload a resume on your profile page first."
                    }), 404
                
                # Build resume text from profile
                resume_parts = []
                
                if profile.full_name:
                    resume_parts.append(f"Name: {profile.full_name}")
                
                if profile.location:
                    resume_parts.append(f"Location: {profile.location}")
                
                if profile.summary:
                    resume_parts.append(f"\nProfessional Summary:\n{profile.summary}")
                
                if profile.job_titles:
                    resume_parts.append(f"\nJob Titles: {', '.join(profile.job_titles)}")
                
                if profile.experience_level:
                    resume_parts.append(f"Experience Level: {profile.experience_level}")
                
                if profile.skills:
                    resume_parts.append(f"\nSkills:\n{', '.join(profile.skills)}")
                
                resume_text = "\n".join(resume_parts)
                
                if len(resume_text) < 100:
                    return jsonify({
                        "error": "Your profile doesn't have enough information. Please upload a resume on your profile page or fill out your profile details."
                    }), 400
        else:
            # Use uploaded resume
            resume_file = request.files.get("resume")
            if not resume_file:
                return jsonify({"error": "Resume file is required"}), 400
            
            # Get file extension
            if '.' not in resume_file.filename:
                return jsonify({"error": "Invalid file - no extension found"}), 400
                
            file_ext = resume_file.filename.rsplit('.', 1)[1].lower()
            
            # Parse resume file
            resume_text = parse_resume_file(resume_file, file_ext)
            
            if not resume_text:
                return jsonify({"error": "Could not extract text from resume file"}), 400
        
        if not resume_text or len(resume_text.strip()) < 50:
            return jsonify({
                "error": "Resume content is too short or empty. Please ensure your resume has sufficient content."
            }), 400
        
        print(f"[ANALYZE-FIT] Analyzing fit for user {g.user_id}, resume length: {len(resume_text)} chars")
        
        # Analyze fit with Gemini
        analysis = analyze_job_fit_for_briefing(resume_text, job_description)
        
        if not analysis:
            return jsonify({"error": "Failed to generate analysis. Please try again."}), 500
        
        # Ensure all required fields are present
        analysis.setdefault("fit_score", 0)
        analysis.setdefault("recommendation", "fair_fit")
        analysis.setdefault("strengths", [])
        analysis.setdefault("gaps", [])
        analysis.setdefault("skill_recommendations", [])
        analysis.setdefault("experience_match", "Unable to determine experience match")
        analysis.setdefault("message", "Analysis completed")
        analysis.setdefault("should_apply", analysis.get("fit_score", 0) >= 60)
        
        print(f"[ANALYZE-FIT] Analysis complete: {analysis.get('fit_score')}% fit, {analysis.get('recommendation')}")
        
        return jsonify(analysis)
        
    except Exception as e:
        print(f"Apply fit analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to analyze job fit: {str(e)}"}), 500


@apply_briefing_bp.route("/apply/get-resume-status", methods=["GET"])
@require_auth
def get_resume_status():
    """
    Check if user has a resume available for analysis.
    
    Returns:
        - has_resume: bool
        - resume_source: str (resume_file, profile, none)
        - resume_preview: str (first 200 chars)
    """
    try:
        # Check for Resume record
        resume = Resume.query.filter_by(user_id=g.user_id, is_primary=True).first()
        
        if resume and resume.raw_text:
            return jsonify({
                "has_resume": True,
                "resume_source": "resume_file",
                "resume_preview": resume.raw_text[:200] + "..." if len(resume.raw_text) > 200 else resume.raw_text,
                "resume_title": resume.title
            })
        
        # Fallback to profile
        profile = UserProfile.query.filter_by(user_id=g.user_id).first()
        
        if profile and (profile.skills or profile.job_titles or profile.summary):
            profile_text = f"{profile.full_name or ''} - {', '.join(profile.job_titles or [])} - {len(profile.skills or [])} skills"
            return jsonify({
                "has_resume": True,
                "resume_source": "profile",
                "resume_preview": profile_text
            })
        
        return jsonify({
            "has_resume": False,
            "resume_source": "none",
            "resume_preview": None
        })
        
    except Exception as e:
        print(f"Resume status error: {e}")
        return jsonify({"error": "Failed to check resume status"}), 500