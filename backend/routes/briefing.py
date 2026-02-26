"""
Apply briefing routes - Analyze job fit before applying.
"""

from flask import Blueprint, request, jsonify, g
from database import get_db_helper
from services.auth import require_auth
from services.gemini import analyze_job_fit_for_briefing
from services.parser import parse_resume_file
from services.subscription import require_feature, get_usage_summary

apply_briefing_bp = Blueprint("apply_briefing", __name__)


@apply_briefing_bp.route("/apply/analyze-fit", methods=["POST"])
@require_auth
@require_feature("cv_analysis")
def analyze_fit():
    """
    Analyze how well the user fits a job before applying.

    Accepts form data:
        - job_description: str (required, min 50 chars)
        - use_profile_resume: bool (use saved primary resume)
        - resume: File (required if use_profile_resume is false)

    Returns:
        - fit_score, recommendation, strengths, gaps,
          skill_recommendations, experience_match, message,
          should_apply, usage
    """
    try:
        job_description = request.form.get("job_description")
        use_profile_resume = request.form.get("use_profile_resume") == "true"

        if not job_description or len(job_description) < 50:
            return jsonify({"error": "Job description required (min 50 chars)"}), 400

        db = get_db_helper()
        resume_text = ""

        if use_profile_resume:
            # Try to fetch the user's saved primary resume
            result = (
                db.client.table("resumes")
                .select("*")
                .eq("user_id", g.user_id)
                .eq("is_primary", True)
                .execute()
            )

            if result.data and result.data[0].get("raw_text"):
                resume_text = result.data[0]["raw_text"]
            else:
                # Fall back to profile data if no resume uploaded yet
                profile = db.get_profile(g.user_id)
                if not profile:
                    return jsonify({"error": "No resume found. Please upload a resume first."}), 404

                parts = []
                if profile.get("full_name"):
                    parts.append(f"Name: {profile['full_name']}")
                if profile.get("summary"):
                    parts.append(f"Summary: {profile['summary']}")
                if profile.get("skills"):
                    parts.append(f"Skills: {', '.join(profile['skills'])}")
                if profile.get("experience_level"):
                    parts.append(f"Experience level: {profile['experience_level']}")
                resume_text = "\n".join(parts)
        else:
            # Use uploaded file
            resume_file = request.files.get("resume")
            if not resume_file:
                return jsonify({"error": "Resume file required"}), 400

            file_ext = resume_file.filename.rsplit(".", 1)[1].lower()
            resume_text = parse_resume_file(resume_file, file_ext)

        if len(resume_text.strip()) < 50:
            return jsonify({"error": "Resume content too short to analyze"}), 400

        analysis = analyze_job_fit_for_briefing(resume_text, job_description)
        if not analysis:
            return jsonify({"error": "Failed to generate analysis"}), 500

        # Set safe defaults
        analysis.setdefault("fit_score", 0)
        analysis.setdefault("should_apply", analysis.get("fit_score", 0) >= 60)

        # Attach usage info for the frontend counter
        analysis["usage"] = get_usage_summary(g.user_id)

        return jsonify(analysis)

    except Exception as e:
        print(f"Analyze fit error: {e}")
        return jsonify({"error": str(e)}), 500