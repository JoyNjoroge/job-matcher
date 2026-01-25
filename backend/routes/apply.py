"""
Apply route - Application preparation endpoints.
"""

from flask import Blueprint, request, jsonify
from services.gemini import generate_application_materials

apply_bp = Blueprint("apply", __name__)


@apply_bp.route("/apply/prepare", methods=["POST"])
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
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
