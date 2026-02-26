"""
analyze.py  — CV analysis with subscription enforcement
cv.py       — CV refinement + cover letter with subscription enforcement
briefing.py — Apply briefing with subscription enforcement

These are the three gated routes. Copy each section to its respective file.
"""

# ════════════════════════════════════════════════════════════════
# routes/analyze.py
# ════════════════════════════════════════════════════════════════
ANALYZE_PY = '''"""
Analyze route - CV and job description analysis endpoint.
"""

import re
from flask import Blueprint, request, jsonify, g
from services.parser import parse_cv
from services.gemini import analyze_job_fit
from services.auth import require_auth
from services.subscription import require_feature, get_usage_summary

analyze_bp = Blueprint("analyze", __name__)


def clean_text(text):
    if not text:
        return ""
    import re
    cleaned = re.sub(r\'<[^>]*>\', \'\', str(text))
    return \' \'.join(cleaned.split()).strip()


def validate_content(content, content_type="content", min_length=50):
    if not content:
        return False, f"{content_type} is empty or null"
    if len(content.strip()) < min_length:
        return False, f"{content_type} is too short (minimum {min_length} characters)"
    return True, None


@analyze_bp.route("/analyze", methods=["POST"])
@require_auth
@require_feature("cv_analysis")
def analyze():
    try:
        if "cv" not in request.files:
            return jsonify({"error": "CV file is required"}), 400

        cv_file = request.files["cv"]
        if not cv_file.filename:
            return jsonify({"error": "CV file is required"}), 400

        job_description = clean_text(request.form.get("job_description", ""))
        job_url         = request.form.get("job_url", "").strip()

        cv_content = parse_cv(cv_file)
        is_valid, error_msg = validate_content(cv_content, "CV content", 100)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}"}), 400

        if job_url and not job_description:
            from services.scraper import scrape_job_description
            job_description = clean_text(scrape_job_description(job_url))

        is_valid, error_msg = validate_content(job_description, "Job description", 50)
        if not is_valid:
            return jsonify({"error": f"Unable to analyze: {error_msg}"}), 400

        result = analyze_job_fit(cv_content, job_description)

        if result.get("error_code") == "ai_service_unavailable":
            return jsonify({"error": result.get("error")}), 503

        # Attach usage info for frontend counter
        result["usage"] = get_usage_summary(g.user_id)
        return jsonify(result)

    except Exception as e:
        print(f"Analyze error: {e}")
        return jsonify({"error": f"Unable to analyze: {str(e)}"}), 500


@analyze_bp.route("/extension/analyze", methods=["POST"])
@require_auth
@require_feature("cv_analysis")
def analyze_from_extension():
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
'''


# ════════════════════════════════════════════════════════════════
# routes/cv.py
# ════════════════════════════════════════════════════════════════
CV_PY = '''"""
CV routes - Refine CV and generate cover letters with Gemini.
"""

from flask import Blueprint, request, jsonify, g
from services.gemini import _generate_content_text
from services.auth import require_auth
from services.subscription import require_feature, check_cv_refinement_access
import json

cv_bp = Blueprint("cv", __name__)


@cv_bp.route("/cv/refine", methods=["POST"])
@require_auth
def refine_cv():
    """Refine a JSON Resume to better match a job description."""
    # Check CV refinement access (not a daily-limit feature, just plan-gated)
    allowed, error = check_cv_refinement_access(g.user_id)
    if not allowed:
        return jsonify(error), 403

    data            = request.get_json()
    current_cv      = data.get("current_cv", {})
    job_description = data.get("job_description", "")
    company_name    = data.get("company_name", "")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400

    prompt = f"""You are a professional resume writer and ATS optimization expert.

Given this current resume in JSON Resume format:
{json.dumps(current_cv, indent=2)}

And this job description:
{job_description}

Company: {company_name or "Not specified"}

Refine the resume to better match the job description.
Return ONLY a valid JSON object with exactly two keys:
- "refined_cv": complete refined resume in JSON Resume schema
- "changelog": array of 2-5 short strings describing changes

No markdown, no explanation. Return ONLY the JSON."""

    try:
        raw     = _generate_content_text(prompt)
        result  = json.loads(raw)
        return jsonify({
            "refined_cv": result.get("refined_cv", current_cv),
            "changelog":  result.get("changelog", ["CV refined for this role"]),
        })
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned invalid JSON. Please try again."}), 500
    except Exception as e:
        return jsonify({"error": f"Refinement failed: {str(e)}"}), 500


@cv_bp.route("/cv/cover-letter", methods=["POST"])
@require_auth
@require_feature("cover_letter")
def generate_cover_letter():
    """Generate a tailored cover letter."""
    data            = request.get_json()
    resume          = data.get("resume", {})
    job_description = data.get("job_description", "")
    company_name    = data.get("company_name", "")
    tone            = data.get("tone", "professional")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400

    basics = resume.get("basics", {})
    name   = basics.get("name", "the applicant")

    tone_instructions = {
        "professional": "Use a formal, polished tone suitable for corporate roles.",
        "enthusiastic": "Use a warm, energetic tone that conveys genuine excitement.",
        "concise":      "Keep it brief — no more than 250 words. Every sentence must add value.",
    }

    prompt = f"""You are an expert cover letter writer.
Write a compelling cover letter for {name} applying to {company_name or "the company"}.

Candidate resume:
{json.dumps(resume, indent=2)}

Job description:
{job_description}

Tone: {tone_instructions.get(tone, tone_instructions["professional"])}

Guidelines:
1. Open with a strong hook
2. Connect 2-3 specific experiences to job requirements
3. Include a confident closing with call to action
4. 3-4 paragraphs, do NOT fabricate experience

Return ONLY the cover letter text, no JSON, no markdown."""

    try:
        cover_letter = _generate_content_text(prompt)
        return jsonify({"cover_letter": cover_letter.strip()})
    except Exception as e:
        return jsonify({"error": f"Cover letter generation failed: {str(e)}"}), 500
'''


# ════════════════════════════════════════════════════════════════
# routes/briefing.py
# ════════════════════════════════════════════════════════════════
BRIEFING_PY = '''"""Apply briefing routes with subscription enforcement."""
from flask import Blueprint, request, jsonify, g
from database import get_db_helper
from models import UserProfile, Resume
from services.auth import require_auth
from services.gemini import analyze_job_fit_for_briefing
from services.parser import parse_resume_file
from services.subscription import require_feature, get_usage_summary

apply_briefing_bp = Blueprint("apply_briefing", __name__)

@apply_briefing_bp.route("/apply/analyze-fit", methods=["POST"])
@require_auth
@require_feature("cv_analysis")
def analyze_fit():
    try:
        job_description      = request.form.get("job_description")
        use_profile_resume   = request.form.get("use_profile_resume") == "true"

        if not job_description or len(job_description) < 50:
            return jsonify({"error": "Job description required (min 50 chars)"}), 400

        db          = get_db_helper()
        resume_text = ""

        if use_profile_resume:
            result = db.client.table(\'resumes\').select(\'*\').eq(\'user_id\', g.user_id).eq(\'is_primary\', True).execute()
            if result.data and result.data[0].get(\'raw_text\'):
                resume_text = result.data[0][\'raw_text\']
            else:
                profile = db.get_profile(g.user_id)
                if not profile:
                    return jsonify({"error": "No resume found"}), 404
                parts = []
                if profile.get(\'full_name\'): parts.append(f"Name: {profile[\'full_name\']}")
                if profile.get(\'summary\'):   parts.append(f"Summary: {profile[\'summary\']}")
                if profile.get(\'skills\'):    parts.append(f"Skills: {\', \'.join(profile[\'skills\'])}")
                resume_text = "\\n".join(parts)
        else:
            resume_file = request.files.get("resume")
            if not resume_file:
                return jsonify({"error": "Resume file required"}), 400
            file_ext    = resume_file.filename.rsplit(\'.\', 1)[1].lower()
            resume_text = parse_resume_file(resume_file, file_ext)

        if len(resume_text.strip()) < 50:
            return jsonify({"error": "Resume content too short"}), 400

        analysis = analyze_job_fit_for_briefing(resume_text, job_description)
        if not analysis:
            return jsonify({"error": "Failed to generate analysis"}), 500

        analysis.setdefault("fit_score", 0)
        analysis.setdefault("should_apply", analysis.get("fit_score", 0) >= 60)
        analysis["usage"] = get_usage_summary(g.user_id)
        return jsonify(analysis)

    except Exception as e:
        print(f"Analyze fit error: {e}")
        return jsonify({"error": str(e)}), 500
'''
