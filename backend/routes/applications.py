"""
Applications route - Job application tracking endpoints.
"""

from datetime import datetime
from flask import Blueprint, request, jsonify, g

from database import db
from models import JobApplication, ApplicationStatus, Resume
from services.auth import require_auth

applications_bp = Blueprint("applications", __name__)


@applications_bp.route("/applications", methods=["GET"])
@require_auth
def get_applications():
    """
    Get all tracked job applications for current user.
    
    Query params:
        - status: Filter by status (applied, interview, etc.)
        - selected_for_interview: Filter by interview selection
    
    Returns:
        - applications: list of JobApplication objects
    """
    try:
        query = JobApplication.query.filter_by(user_id=g.user_id)
        
        # Filter by status
        status = request.args.get("status")
        if status:
            try:
                status_enum = ApplicationStatus(status)
                query = query.filter_by(status=status_enum)
            except ValueError:
                pass
        
        # Filter by interview selection
        selected = request.args.get("selected_for_interview")
        if selected is not None:
            query = query.filter_by(selected_for_interview=selected.lower() == "true")
        
        applications = query.order_by(JobApplication.updated_at.desc()).all()
        
        return jsonify({
            "applications": [app.to_dict() for app in applications]
        })
        
    except Exception as e:
        print(f"Get applications error: {e}")
        return jsonify({"error": "Failed to get applications"}), 500


@applications_bp.route("/applications/<application_id>", methods=["GET"])
@require_auth
def get_application(application_id):
    """Get a specific application by ID."""
    try:
        application = JobApplication.query.filter_by(
            id=application_id, 
            user_id=g.user_id
        ).first()
        
        if not application:
            return jsonify({"error": "Application not found"}), 404
        
        return jsonify({"application": application.to_dict()})
        
    except Exception as e:
        print(f"Get application error: {e}")
        return jsonify({"error": "Failed to get application"}), 500


@applications_bp.route("/applications", methods=["POST"])
@require_auth
def create_application():
    """
    Create a new job application.
    
    Body:
        - job_title: str (required)
        - company: str (required)
        - location: str
        - job_description: str
        - source_url: str
        - source_platform: str
        - status: str (draft, applied, etc.)
        - fit_score: int
        - interview_likelihood: str
        - analysis: object
        - resume_id: str (optional)
    
    Returns:
        - application: Created JobApplication object
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        job_title = data.get("job_title", "").strip()
        company = data.get("company", "").strip()
        
        if not job_title or not company:
            return jsonify({"error": "Job title and company are required"}), 400
        
        # Parse status
        status = ApplicationStatus.DRAFT
        if data.get("status"):
            try:
                status = ApplicationStatus(data["status"])
            except ValueError:
                pass
        
        application = JobApplication(
            user_id=g.user_id,
            job_title=job_title,
            company=company,
            location=data.get("location"),
            job_description=data.get("job_description"),
            source_url=data.get("source_url"),
            source_platform=data.get("source_platform"),
            status=status,
            fit_score=data.get("fit_score"),
            interview_likelihood=data.get("interview_likelihood"),
            analysis_json=data.get("analysis", {}),
            resume_id=data.get("resume_id"),
        )
        
        # If status is applied, set applied_at
        if status == ApplicationStatus.APPLIED:
            application.applied_at = datetime.utcnow()
        
        db.session.add(application)
        db.session.commit()
        
        return jsonify({"application": application.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create application error: {e}")
        return jsonify({"error": "Failed to create application"}), 500


@applications_bp.route("/applications/<application_id>", methods=["PUT", "PATCH"])
@require_auth
def update_application(application_id):
    """
    Update an existing application.
    
    Body:
        - status: str
        - selected_for_interview: bool
        - fit_score: int
        - analysis: object
        - interview_prep: object
    
    Returns:
        - application: Updated JobApplication object
    """
    try:
        application = JobApplication.query.filter_by(
            id=application_id,
            user_id=g.user_id
        ).first()
        
        if not application:
            return jsonify({"error": "Application not found"}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        # Update status
        if "status" in data:
            try:
                new_status = ApplicationStatus(data["status"])
                if new_status == ApplicationStatus.APPLIED and application.status != ApplicationStatus.APPLIED:
                    application.applied_at = datetime.utcnow()
                application.status = new_status
            except ValueError:
                pass
        
        # Update other fields
        if "selected_for_interview" in data:
            application.selected_for_interview = data["selected_for_interview"]
        
        if "fit_score" in data:
            application.fit_score = data["fit_score"]
        
        if "interview_likelihood" in data:
            application.interview_likelihood = data["interview_likelihood"]
        
        if "analysis" in data:
            application.analysis_json = data["analysis"]
        
        if "interview_prep" in data:
            application.interview_prep_json = data["interview_prep"]
        
        db.session.commit()
        
        return jsonify({"application": application.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        print(f"Update application error: {e}")
        return jsonify({"error": "Failed to update application"}), 500


@applications_bp.route("/applications/<application_id>", methods=["DELETE"])
@require_auth
def delete_application(application_id):
    """Delete an application."""
    try:
        application = JobApplication.query.filter_by(
            id=application_id,
            user_id=g.user_id
        ).first()
        
        if not application:
            return jsonify({"error": "Application not found"}), 404
        
        db.session.delete(application)
        db.session.commit()
        
        return jsonify({"message": "Application deleted successfully"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Delete application error: {e}")
        return jsonify({"error": "Failed to delete application"}), 500


@applications_bp.route("/applications/track", methods=["POST"])
@require_auth
def track_from_extension():
    """
    Track application from browser extension.
    
    Body:
        - job_url: str
        - job_title: str
        - company: str
        - platform: str
        - timestamp: str
    
    Returns:
        - application: Created/updated JobApplication object
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        job_url = data.get("job_url", "").strip()
        job_title = data.get("job_title", "").strip()
        company = data.get("company", "").strip()
        
        if not job_title or not company:
            return jsonify({"error": "Job title and company are required"}), 400
        
        # Check for existing application with same URL
        existing = None
        if job_url:
            existing = JobApplication.query.filter_by(
                user_id=g.user_id,
                source_url=job_url
            ).first()
        
        if existing:
            # Update existing application
            existing.status = ApplicationStatus.APPLIED
            existing.tracked_by_extension = True
            existing.applied_at = datetime.utcnow()
            db.session.commit()
            return jsonify({"application": existing.to_dict()})
        
        # Create new application
        application = JobApplication(
            user_id=g.user_id,
            job_title=job_title,
            company=company,
            source_url=job_url,
            source_platform=data.get("platform"),
            status=ApplicationStatus.APPLIED,
            tracked_by_extension=True,
            applied_at=datetime.utcnow(),
        )
        
        db.session.add(application)
        db.session.commit()
        
        return jsonify({"application": application.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Track from extension error: {e}")
        return jsonify({"error": "Failed to track application"}), 500
