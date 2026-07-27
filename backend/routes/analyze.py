"""
Analyze route - CV and job description analysis endpoint.
"""

import re
from flask import Blueprint, request, jsonify, g
from services.parser import parse_cv
from services.ai import analyze_job_fit
from services.auth import require_auth
from services.subscription import require_feature, get_usage_summary

analyze_bp = Blueprint("analyze", __name__)


def clean_text(text):
    """Clean and validate text input."""
    if not text:
        return ""
    cleaned = re.sub(r'<[^>]*>', '', str(text))
    return ' '.join(cleaned.split()).strip()


def validate_content(content, content_type="content", min_length=50):
    """Validate that content meets minimum requirements."""
    if not content:
        return False, f"{content_type} is empty or null"
    if len(content.strip()) < min_length:
        return False, f"{content_type} is too short (minimum {min_length} characters)"
    return True, None


@analyze_bp.route("/analyze", methods=["POST"])
@require_auth
@require_feature("cv_analysis")
def analyze():
    """
    Analyze CV against job description.

    Accepts:
        - cv: File (PDF or DOCX)
        - job_description: str (optional)
        - job_url: str (optional)
        - job_title: str (optional)
        - company: str (optional)

    Returns:
        - fit_score, interview_likelihood, strengths, gaps, red_flags
        - job_description, job_title, company, job_url, usage
    """
    try:
        if "cv" not in request.files:
            return jsonify({"error": "CV file is required"}), 400

        cv_file = request.files["cv"]
        if not cv_file.filename:
            return jsonify({"error": "CV file is required"}), 400

        job_description = clean_text(request.form.get("job_description", ""))
        job_url = request.form.get("job_url", "").strip()
        job_title = clean_text(request.form.get("job_title", ""))
        company = clean_text(request.form.get("company", ""))

        # Parse CV
        cv_content = parse_cv(cv_file)
        is_valid, error_msg = validate_content(cv_content, "CV content", 100)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}. Please ensure your CV contains sufficient text."}), 400

        # Scrape job URL if no description provided
        if job_url and not job_description:
            from services.scraper import scrape_job_description
            job_description = clean_text(scrape_job_description(job_url))

        is_valid, error_msg = validate_content(job_description, "Job description", 50)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}. Please provide a complete job description."}), 400

        result = dict(analyze_job_fit(
            cv_content,
            job_description,
            job_title=job_title,
            company=company,
        ))

        if result.get("error_code") == "ai_service_unavailable":
            return jsonify({"error": result.get("error")}), 503

        # Return the authoritative context used for the analysis. In particular,
        # URL analyses need the scraped/cleaned description on the client so it
        # can be carried into downstream CV and cover-letter generation.
        result["job_description"] = job_description
        result["job_title"] = job_title
        result["company"] = company
        result["job_url"] = job_url

        # Attach usage info so frontend can update the counter
        result["usage"] = get_usage_summary(g.user_id)
        return jsonify(result)

    except Exception as e:
        print(f"Analyze error: {e}")
        return jsonify({"error": f"Unable to analyze: {str(e)}"}), 500


@analyze_bp.route("/extension/analyze", methods=["POST"])
@require_auth
@require_feature("cv_analysis")
def analyze_from_extension():
    """
    Analyze job from browser extension payload.

    Accepts JSON:
        - job_title: str
        - company: str
        - job_description: str (required)

    Returns same as /analyze endpoint.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON payload required"}), 400

        job_description = clean_text(data.get("job_description", ""))

        is_valid, error_msg = validate_content(job_description, "Job description", 50)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}"}), 400

        result = analyze_job_fit(
            cv_content="",
            job_description=job_description,
            job_title=clean_text(data.get("job_title", "")),
            company=clean_text(data.get("company", "")),
        )

        if result.get("error_code") == "ai_service_unavailable":
            return jsonify({"error": result.get("error")}), 503

        result["usage"] = get_usage_summary(g.user_id)
        return jsonify(result)

    except Exception as e:
        print(f"Extension analyze error: {e}")
        return jsonify({"error": f"Unable to analyze: {str(e)}"}), 500
