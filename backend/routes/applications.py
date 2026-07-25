"""Applications routes - UPDATED FOR SUPABASE"""
from flask import Blueprint, request, jsonify, g
from database import get_db_helper
from models import JobApplication, ApplicationStatus
from services.auth import require_auth
from datetime import datetime

applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/applications', methods=['GET'])
@require_auth
def get_applications():
    try:
        db = get_db_helper()
        applications = db.get_applications(g.user_id)
        return jsonify({"applications": [JobApplication.to_dict(app) for app in applications]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@applications_bp.route('/applications', methods=['POST'])
@require_auth
def create_application():
    try:
        data = request.get_json(silent=True) or {}
        if not data.get('job_title') or not data.get('company'):
            return jsonify({"error": "job_title and company are required"}), 400
        
        application_data = JobApplication.create_new(
            user_id=g.user_id,
            job_title=data['job_title'],
            company=data['company'],
            location=data.get('location'),
            job_description=data.get('job_description'),
            source_url=data.get('source_url'),
            source_platform=data.get('source_platform'),
            resume_id=data.get('resume_id'),
            tracked_by_extension=bool(data.get('tracked_by_extension')),
            applied_at=data.get('applied_at'),
        )
        if data.get("status") == ApplicationStatus.APPLIED.value:
            application_data["status"] = ApplicationStatus.APPLIED.value
        
        db = get_db_helper()
        result = db.create_application(application_data)
        return jsonify({"application": JobApplication.to_dict(result)}), 201
    except Exception:
        return jsonify({"error": "Failed to create application"}), 500

@applications_bp.route('/applications/<application_id>', methods=['GET'])
@require_auth
def get_application(application_id):
    try:
        db = get_db_helper()
        application = db.get_application_by_id(application_id)
        
        if not application:
            return jsonify({"error": "Application not found"}), 404
        if application['user_id'] != g.user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        return jsonify({"application": JobApplication.to_dict(application)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@applications_bp.route('/applications/<application_id>', methods=['PATCH'])
@require_auth
def update_application(application_id):
    try:
        data = request.get_json()
        db = get_db_helper()
        application = db.get_application_by_id(application_id)
        
        if not application or application['user_id'] != g.user_id:
            return jsonify({"error": "Application not found"}), 404
        
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        allowed_fields = [
            'job_title', 'company', 'location', 'job_description',
            'source_url', 'source_platform', 'status', 'fit_score',
            'interview_likelihood', 'analysis_json', 'resume_id',
            'selected_for_interview', 'interview_prep_json'
        ]
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        result = db.update_application(application_id, update_data)
        return jsonify({"application": JobApplication.to_dict(result)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@applications_bp.route('/applications/<application_id>/mark-applied', methods=['POST'])
@require_auth
def mark_application_applied(application_id):
    try:
        db = get_db_helper()
        application = db.get_application_by_id(application_id)
        
        if not application or application['user_id'] != g.user_id:
            return jsonify({"error": "Application not found"}), 404
        
        updated_data = JobApplication.mark_applied(application)
        result = db.update_application(application_id, updated_data)
        return jsonify({"application": JobApplication.to_dict(result)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
