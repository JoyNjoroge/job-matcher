"""
Analyze route - CV and job description analysis endpoint.
"""

import re
from flask import Blueprint, request, jsonify
from services.parser import parse_cv
from services.gemini import analyze_job_fit

analyze_bp = Blueprint("analyze", __name__)


def clean_text(text):
    """Clean and validate text input."""
    if not text:
        return ""
    # Remove HTML tags
    cleaned = re.sub(r'<[^>]*>', '', str(text))
    # Normalize whitespace
    cleaned = ' '.join(cleaned.split())
    return cleaned.strip()


def validate_content(content, content_type="content", min_length=50):
    """Validate that content is not null and meets minimum requirements."""
    if not content:
        return False, f"{content_type} is empty or null"
    if len(content.strip()) < min_length:
        return False, f"{content_type} is too short (minimum {min_length} characters)"
    return True, None


@analyze_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze CV against job description.
    
    Accepts:
        - cv: File (PDF or DOCX)
        - job_description: str (optional)
        - job_url: str (optional)
    
    Returns:
        - fit_score: int (0-100)
        - interview_likelihood: str (low/medium/high)
        - strengths: list[str]
        - gaps: list[str]
        - red_flags: list[str]
    """
    try:
        # Get CV file
        if "cv" not in request.files:
            return jsonify({"error": "CV file is required"}), 400
        
        cv_file = request.files["cv"]
        
        if not cv_file.filename:
            return jsonify({"error": "CV file is required"}), 400
        
        job_description = clean_text(request.form.get("job_description", ""))
        job_url = request.form.get("job_url", "").strip()
        
        # Parse CV content
        cv_content = parse_cv(cv_file)
        
        # Validate CV content
        is_valid, error_msg = validate_content(cv_content, "CV content", 100)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}. Please ensure your CV is readable and contains sufficient text."}), 400
        
        # If job_url provided but no description, scrape it
        if job_url and not job_description:
            from services.scraper import scrape_job_description
            job_description = clean_text(scrape_job_description(job_url))
        
        # Validate job description
        is_valid, error_msg = validate_content(job_description, "Job description", 50)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}. Please provide a complete job description."}), 400
        
        # Analyze with Gemini
        result = analyze_job_fit(cv_content, job_description)
        
        # Validate result
        if result.get("strengths", [""])[0] == "Unable to analyze - please try again":
            return jsonify({"error": "Unable to analyze this job. Please try again or check your inputs."}), 500
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Analyze error: {e}")
        return jsonify({"error": f"Unable to analyze: {str(e)}"}), 500


@analyze_bp.route("/extension/analyze", methods=["POST"])
def analyze_from_extension():
    """
    Analyze job from browser extension payload.
    
    Accepts JSON:
        - job_title: str
        - company: str
        - job_description: str
    
    Returns same as /analyze endpoint.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "JSON payload required"}), 400
        
        job_title = clean_text(data.get("job_title", ""))
        company = clean_text(data.get("company", ""))
        job_description = clean_text(data.get("job_description", ""))
        
        # Validate job description
        is_valid, error_msg = validate_content(job_description, "Job description", 50)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}"}), 400
        
        # For extension analysis, we use a stored CV or require it to be set up
        # This is a simplified version - you'd typically fetch the user's stored CV
        result = analyze_job_fit(
            cv_content="",  # Would be fetched from user storage
            job_description=job_description,
            job_title=job_title,
            company=company
        )
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Extension analyze error: {e}")
        return jsonify({"error": f"Unable to analyze: {str(e)}"}), 500
