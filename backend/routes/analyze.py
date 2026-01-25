"""
Analyze route - CV and job description analysis endpoint.
"""

from flask import Blueprint, request, jsonify
from services.parser import parse_cv
from services.gemini import analyze_job_fit

analyze_bp = Blueprint("analyze", __name__)


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
        job_description = request.form.get("job_description", "")
        job_url = request.form.get("job_url", "")
        
        # Parse CV content
        cv_content = parse_cv(cv_file)
        
        if not cv_content:
            return jsonify({"error": "Failed to parse CV"}), 400
        
        # If job_url provided but no description, scrape it
        if job_url and not job_description:
            from services.scraper import scrape_job_description
            job_description = scrape_job_description(job_url)
        
        if not job_description:
            return jsonify({"error": "Job description or URL is required"}), 400
        
        # Analyze with Gemini
        result = analyze_job_fit(cv_content, job_description)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
        
        job_title = data.get("job_title", "")
        company = data.get("company", "")
        job_description = data.get("job_description", "")
        
        if not job_description:
            return jsonify({"error": "Job description is required"}), 400
        
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
        return jsonify({"error": str(e)}), 500
