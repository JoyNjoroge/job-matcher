"""
Resume routes - CV upload, parsing, and management.
"""

from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename

from database import db
from models import Resume
from services.auth import require_auth
from services.parser import parse_resume_file, extract_resume_structure

resumes_bp = Blueprint("resumes", __name__)

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}


def allowed_file(filename):
    """Check if file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@resumes_bp.route("/resumes", methods=["GET"])
@require_auth
def get_resumes():
    """
    Get all resumes for current user.
    
    Returns:
        - resumes: list of Resume objects
    """
    try:
        resumes = Resume.query.filter_by(user_id=g.user_id).order_by(Resume.updated_at.desc()).all()
        return jsonify({"resumes": [r.to_dict() for r in resumes]})
    except Exception as e:
        print(f"Get resumes error: {e}")
        return jsonify({"error": "Failed to get resumes"}), 500


@resumes_bp.route("/resumes/<resume_id>", methods=["GET"])
@require_auth
def get_resume(resume_id):
    """
    Get a specific resume.
    
    Returns:
        - resume: Resume object with raw text
    """
    try:
        resume = Resume.query.filter_by(id=resume_id, user_id=g.user_id).first()
        
        if not resume:
            return jsonify({"error": "Resume not found"}), 404
        
        return jsonify({"resume": resume.to_dict(include_raw=True)})
    except Exception as e:
        print(f"Get resume error: {e}")
        return jsonify({"error": "Failed to get resume"}), 500


@resumes_bp.route("/resumes/upload", methods=["POST"])
@require_auth
def upload_resume():
    """
    Upload and parse a resume file.
    
    Form data:
        - file: Resume file (PDF, DOCX, DOC, TXT)
        - title: Optional title for the resume
        - is_primary: Optional boolean to set as primary
    
    Returns:
        - resume: Created Resume object with parsed data
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit(".", 1)[1].lower()
        
        # Parse file content
        raw_text = parse_resume_file(file, file_ext)
        
        if not raw_text or len(raw_text.strip()) < 50:
            return jsonify({"error": "Could not extract text from file. Please try a different format."}), 400
        
        # Extract structured data
        parsed_json = extract_resume_structure(raw_text)
        
        # Check if setting as primary
        is_primary = request.form.get("is_primary", "false").lower() == "true"
        title = request.form.get("title", filename)
        
        # If setting as primary, unset other primary resumes
        if is_primary:
            Resume.query.filter_by(user_id=g.user_id, is_primary=True).update({"is_primary": False})
        
        # Create resume record
        resume = Resume(
            user_id=g.user_id,
            original_filename=filename,
            file_type=file_ext,
            raw_text=raw_text,
            parsed_json=parsed_json,
            is_primary=is_primary,
            title=title,
            source="upload"
        )
        
        db.session.add(resume)
        db.session.commit()
        
        return jsonify({"resume": resume.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Upload resume error: {e}")
        return jsonify({"error": f"Failed to upload resume: {str(e)}"}), 500


@resumes_bp.route("/resumes/manual", methods=["POST"])
@require_auth
def create_manual_resume():
    """
    Create a resume manually without file upload.
    
    Body:
        - title: str
        - parsed_json: object with resume structure
        - is_primary: bool (optional)
    
    Returns:
        - resume: Created Resume object
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        title = data.get("title", "My Resume")
        parsed_json = data.get("parsed_json", {})
        is_primary = data.get("is_primary", False)
        
        # If setting as primary, unset others
        if is_primary:
            Resume.query.filter_by(user_id=g.user_id, is_primary=True).update({"is_primary": False})
        
        # Generate raw text from parsed JSON for search/analysis
        raw_text = generate_raw_text_from_json(parsed_json)
        
        resume = Resume(
            user_id=g.user_id,
            raw_text=raw_text,
            parsed_json=parsed_json,
            is_primary=is_primary,
            title=title,
            source="manual"
        )
        
        db.session.add(resume)
        db.session.commit()
        
        return jsonify({"resume": resume.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create manual resume error: {e}")
        return jsonify({"error": "Failed to create resume"}), 500


@resumes_bp.route("/resumes/<resume_id>", methods=["PUT", "PATCH"])
@require_auth
def update_resume(resume_id):
    """
    Update a resume.
    
    Body:
        - title: str
        - parsed_json: object
        - is_primary: bool
    
    Returns:
        - resume: Updated Resume object
    """
    try:
        resume = Resume.query.filter_by(id=resume_id, user_id=g.user_id).first()
        
        if not resume:
            return jsonify({"error": "Resume not found"}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        if "title" in data:
            resume.title = data["title"]
        
        if "parsed_json" in data:
            resume.parsed_json = data["parsed_json"]
            resume.raw_text = generate_raw_text_from_json(data["parsed_json"])
        
        if "is_primary" in data and data["is_primary"]:
            Resume.query.filter_by(user_id=g.user_id, is_primary=True).update({"is_primary": False})
            resume.is_primary = True
        
        db.session.commit()
        
        return jsonify({"resume": resume.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        print(f"Update resume error: {e}")
        return jsonify({"error": "Failed to update resume"}), 500


@resumes_bp.route("/resumes/<resume_id>", methods=["DELETE"])
@require_auth
def delete_resume(resume_id):
    """
    Delete a resume.
    
    Returns:
        - message: Success message
    """
    try:
        resume = Resume.query.filter_by(id=resume_id, user_id=g.user_id).first()
        
        if not resume:
            return jsonify({"error": "Resume not found"}), 404
        
        db.session.delete(resume)
        db.session.commit()
        
        return jsonify({"message": "Resume deleted successfully"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Delete resume error: {e}")
        return jsonify({"error": "Failed to delete resume"}), 500


@resumes_bp.route("/resumes/primary", methods=["GET"])
@require_auth
def get_primary_resume():
    """
    Get user's primary resume.
    
    Returns:
        - resume: Primary Resume object or null
    """
    try:
        resume = Resume.query.filter_by(user_id=g.user_id, is_primary=True).first()
        
        if not resume:
            # Return first resume if no primary set
            resume = Resume.query.filter_by(user_id=g.user_id).first()
        
        if not resume:
            return jsonify({"resume": None})
        
        return jsonify({"resume": resume.to_dict(include_raw=True)})
        
    except Exception as e:
        print(f"Get primary resume error: {e}")
        return jsonify({"error": "Failed to get primary resume"}), 500


def generate_raw_text_from_json(parsed_json: dict) -> str:
    """Generate searchable text from structured resume JSON."""
    parts = []
    
    # Summary
    if parsed_json.get("summary"):
        parts.append(parsed_json["summary"])
    
    # Experience
    for exp in parsed_json.get("experience", []):
        parts.append(f"{exp.get('title', '')} at {exp.get('company', '')}")
        parts.append(exp.get("description", ""))
    
    # Education
    for edu in parsed_json.get("education", []):
        parts.append(f"{edu.get('degree', '')} from {edu.get('institution', '')}")
    
    # Skills
    skills = parsed_json.get("skills", [])
    if skills:
        parts.append("Skills: " + ", ".join(skills))
    
    # Tools
    tools = parsed_json.get("tools", [])
    if tools:
        parts.append("Tools: " + ", ".join(tools))
    
    # Projects
    for proj in parsed_json.get("projects", []):
        parts.append(f"{proj.get('name', '')}: {proj.get('description', '')}")
    
    return "\n\n".join(filter(None, parts))
