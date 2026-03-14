"""Resumes routes - UPDATED FOR SUPABASE"""
from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
from database import get_db_helper
from models import Resume
from services.auth import require_auth
from services.parser import parse_resume_file, extract_resume_structure
from datetime import datetime
from services.subscription import get_resume_limit

resumes_bp = Blueprint("resumes", __name__)
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@resumes_bp.route("/resumes", methods=["GET"])
@require_auth
def get_resumes():
    limit   = get_resumes_limit(g.user_id)
    db      = get_db_helper()
    current = len(db.get_resumes(g.user_id))
    if current >= limit:
        return jsonify({
            "error": f"Your plan allows {limit} resume(s). Delete one or upgrade.",
            "error_code": "resume_limit_reached",
            "upgrade_required": True,
        }), 403
    try:
        db = get_db_helper()
        resumes = db.get_resumes(g.user_id)
        return jsonify({"resumes": [Resume.to_dict(r) for r in resumes]})
    except Exception as e:
        print(f"Get resumes error: {e}")
        return jsonify({"error": "Failed to get resumes"}), 500

@resumes_bp.route("/resumes/<resume_id>", methods=["GET"])
@require_auth
def get_resume(resume_id):
    try:
        db = get_db_helper()
        resume = db.get_resume_by_id(resume_id)
        if not resume or resume['user_id'] != g.user_id:
            return jsonify({"error": "Resume not found"}), 404
        return jsonify({"resume": Resume.to_dict(resume, include_raw=True)})
    except Exception as e:
        return jsonify({"error": "Failed to get resume"}), 500

@resumes_bp.route("/resumes/upload", methods=["POST"])
@require_auth
def upload_resume():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if not file.filename or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file"}), 400
        
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit(".", 1)[1].lower()
        
        raw_text = parse_resume_file(file, file_ext)
        if not raw_text or len(raw_text.strip()) < 50:
            return jsonify({"error": "Could not extract text"}), 400
        
        parsed_json = extract_resume_structure(raw_text)
        is_primary = request.form.get("is_primary", "false").lower() == "true"
        title = request.form.get("title", filename)
        
        db = get_db_helper()
        
        if is_primary:
            db.client.table('resumes').update({"is_primary": False}).eq('user_id', g.user_id).execute()
        
        resume_data = Resume.create_new(
            user_id=g.user_id,
            original_filename=filename,
            file_type=file_ext,
            raw_text=raw_text,
            parsed_json=parsed_json,
            is_primary=is_primary,
            title=title,
            source="upload"
        )
        
        result = db.create_resume(resume_data)
        return jsonify({"resume": Resume.to_dict(result)}), 201
    except Exception as e:
        print(f"Upload resume error: {e}")
        return jsonify({"error": "Failed to upload resume"}), 500

@resumes_bp.route("/resumes/<resume_id>", methods=["DELETE"])
@require_auth
def delete_resume(resume_id):
    try:
        db = get_db_helper()
        resume = db.get_resume_by_id(resume_id)
        if not resume or resume['user_id'] != g.user_id:
            return jsonify({"error": "Resume not found"}), 404
        
        db.delete_resume(resume_id)
        return jsonify({"message": "Resume deleted successfully"})
    except Exception as e:
        return jsonify({"error": "Failed to delete resume"}), 500

@resumes_bp.route("/resumes/primary", methods=["GET"])
@require_auth
def get_primary_resume():
    try:
        db = get_db_helper()
        result = db.client.table('resumes').select('*').eq('user_id', g.user_id).eq('is_primary', True).execute()
        
        if result.data:
            return jsonify({"resume": Resume.to_dict(result.data[0], include_raw=True)})
        
        resumes = db.get_resumes(g.user_id)
        if resumes:
            return jsonify({"resume": Resume.to_dict(resumes[0], include_raw=True)})
        
        return jsonify({"resume": None})
    except Exception as e:
        return jsonify({"error": "Failed to get primary resume"}), 500