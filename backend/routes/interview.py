"""
Interview route - Interview preparation endpoints.
"""

from flask import Blueprint, request, jsonify
from services.gemini import generate_interview_prep

interview_bp = Blueprint("interview", __name__)


@interview_bp.route("/interview-prep", methods=["POST"])
def get_interview_prep():
    """
    Generate interview preparation materials.
    
    Accepts JSON:
        - application_id: str
    
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
        
        if not application_id:
            return jsonify({"error": "Application ID is required"}), 400
        
        # In production, fetch application details from database
        result = generate_interview_prep(application_id)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
