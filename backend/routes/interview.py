"""
Interview route - Interview preparation endpoints.
"""

from flask import Blueprint, request, jsonify
from services.ai import generate_interview_prep
from services.auth import require_auth
from services.subscription import require_feature

interview_bp = Blueprint("interview", __name__)


def clean_text(text):
    """Clean and validate text input."""
    if not text:
        return ""
    # Remove excessive whitespace and HTML tags
    import re
    cleaned = re.sub(r'<[^>]*>', '', str(text))
    cleaned = ' '.join(cleaned.split())
    return cleaned.strip()


@interview_bp.route("/interview-prep", methods=["POST"])
@require_auth
@require_feature("interview_prep")
def get_interview_prep():
    """
    Generate interview preparation materials.
    
    Accepts JSON:
        - application_id: str
        - job_title: str (optional)
        - company: str (optional)
        - job_description: str (required)
        - cv_text: str (optional)
    
    Returns:
        - questions: list of objects with:
            - question: str
            - what_they_test: str
            - talking_points: list[str]
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "JSON payload required"}), 400
        
        application_id = data.get("application_id", "")
        job_title = clean_text(data.get("job_title", ""))
        company = clean_text(data.get("company", ""))
        job_description = clean_text(data.get("job_description", ""))
        cv_text = clean_text(data.get("cv_text", ""))
        
        # Validate required fields
        if not job_description:
            return jsonify({"error": "Job description is required for interview prep"}), 400
        
        if len(job_description) < 50:
            return jsonify({"error": "Job description is too short. Please provide more details."}), 400
        
        result = generate_interview_prep(
            application_id=application_id,
            job_title=job_title,
            company=company,
            job_description=job_description,
            cv_text=cv_text
        )
        
        if result.get("error_code") == "ai_service_unavailable":
            return jsonify({"error": result.get("error", "Unable to generate interview prep right now.")}), 503

        # Validate result
        if not result.get("questions") or len(result["questions"]) == 0:
            return jsonify({"error": "Failed to generate interview questions. Please try again."}), 500

        return jsonify(result)
    
    except Exception as e:
        print(f"Interview prep error: {e}")
        return jsonify({"error": f"Unable to generate interview prep: {str(e)}"}), 500
