"""
CV routes - Refine CV and generate cover letters with AI provider.
"""

import json
from flask import Blueprint, request, jsonify, g
from services.ai import _generate_content_text
from services.auth import require_auth
from services.subscription import require_feature, check_cv_refinement_access

cv_bp = Blueprint("cv", __name__)


@cv_bp.route("/cv/refine", methods=["POST"])
@require_auth
@require_feature("cv_generation")
def refine_cv():
    """
    Refine a JSON Resume to better match a job description.
    Requires Seeker or Pro plan.
    """
    # CV refinement is plan-gated (not daily-limited)
    allowed, error = check_cv_refinement_access(g.user_id)
    if not allowed:
        return jsonify(error), 403

    data = request.get_json()
    current_cv = data.get("current_cv", {})
    job_description = data.get("job_description", "")
    company_name = data.get("company_name", "")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400

    prompt = f"""You are a professional resume writer and ATS optimization expert.

Given this current resume in JSON Resume format:
{json.dumps(current_cv, indent=2)}

And this job description:
{job_description}

Company: {company_name or "Not specified"}

Please refine the resume to better match the job description. You should:
1. Tailor the professional summary to highlight relevant experience
2. Reorder and emphasize relevant skills
3. Add quantified achievements where possible (use realistic numbers)
4. Add relevant keywords from the job description naturally
5. Improve bullet points with action verbs and measurable impact
6. Keep all information truthful - enhance presentation, don't fabricate

Return ONLY a valid JSON object with exactly two keys:
- "refined_cv": the complete refined resume in the exact same JSON Resume schema
- "changelog": an array of 2-5 short strings describing what was changed

Do NOT include any markdown formatting, code blocks, or explanation. Return ONLY the JSON."""

    try:
        raw = _generate_content_text(prompt)
        result = json.loads(raw)
        return jsonify({
            "refined_cv": result.get("refined_cv", current_cv),
            "changelog": result.get("changelog", ["CV has been refined for this role"]),
        })
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned invalid JSON. Please try again."}), 500
    except Exception as e:
        return jsonify({"error": f"Refinement failed: {str(e)}"}), 500


@cv_bp.route("/cv/cover-letter", methods=["POST"])
@require_auth
@require_feature("cover_letter")
def generate_cover_letter():
    """
    Generate a tailored cover letter.
    Requires Seeker or Pro plan (cover_letter feature).
    """
    data = request.get_json()
    resume = data.get("resume", {})
    job_description = data.get("job_description", "")
    company_name = data.get("company_name", "")
    tone = data.get("tone", "professional")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400

    basics = resume.get("basics", {})
    name = basics.get("name", "the applicant")

    tone_instructions = {
        "professional": "Use a formal, polished tone suitable for corporate roles.",
        "enthusiastic": "Use a warm, energetic tone that conveys genuine excitement about the role and company.",
        "concise": "Keep it brief and direct — no more than 250 words. Every sentence must add value.",
    }

    prompt = f"""You are an expert cover letter writer.

Write a compelling cover letter for {name} applying to {company_name or "the company"}.

Candidate's resume data:
{json.dumps(resume, indent=2)}

Job description:
{job_description}

Tone: {tone_instructions.get(tone, tone_instructions["professional"])}

Guidelines:
1. Open with a strong hook — not "I am writing to apply for..."
2. Connect 2-3 specific experiences/skills from the resume to requirements in the job description
3. Show knowledge of the company if the company name is provided
4. Include a confident closing with a call to action
5. Keep it to 3-4 paragraphs
6. Do NOT fabricate experience — only reference what's in the resume

Return ONLY the cover letter text, no JSON, no markdown formatting, no extra explanation."""

    try:
        cover_letter = _generate_content_text(prompt)
        return jsonify({"cover_letter": cover_letter.strip()})
    except Exception as e:
        return jsonify({"error": f"Cover letter generation failed: {str(e)}"}), 500