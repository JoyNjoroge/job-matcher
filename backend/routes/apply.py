"""
Apply route - Application preparation endpoints.
"""

from flask import Blueprint, request, jsonify
from services.ai import generate_application_materials
from services.auth import require_auth

apply_bp = Blueprint("apply", __name__)


@apply_bp.route("/apply/prepare", methods=["POST"])
@require_auth
def prepare_application():
    """
    Prepare application materials for a job.
    
    Accepts JSON:
        - job_id: str
    
    Returns:
        - draft_email: str
        - resume_suggestions: list[str]
        - ats_notes: list[str]
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "JSON payload required"}), 400
        
        job_id = data.get("job_id", "")
        
        if not job_id:
            return jsonify({"error": "Job ID is required"}), 400
        
        # In production, fetch job details from database
        # For now, generate generic materials
        result = generate_application_materials(job_id)

        if result.get("error_code") == "ai_service_unavailable":
            return jsonify({"error": result.get("error", "Unable to generate application materials right now.")}), 503

        return jsonify(result)
    
    except Exception:
        return jsonify({"error": "Unable to prepare application"}), 500
