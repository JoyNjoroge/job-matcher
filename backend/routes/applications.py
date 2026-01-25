"""
Applications route - Job application tracking endpoints.
"""

from flask import Blueprint, jsonify

applications_bp = Blueprint("applications", __name__)

# In-memory storage (replace with database in production)
applications_store = []


@applications_bp.route("/applications", methods=["GET"])
def get_applications():
    """
    Get all tracked job applications.
    
    Returns:
        - list of Application objects with:
            - id: str
            - job_title: str
            - company: str
            - fit_score: int
            - interview_likelihood: str
            - created_at: str (ISO format)
    """
    return jsonify(applications_store)


@applications_bp.route("/applications/<application_id>", methods=["GET"])
def get_application(application_id):
    """Get a specific application by ID."""
    application = next(
        (app for app in applications_store if app["id"] == application_id),
        None
    )
    
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    return jsonify(application)
