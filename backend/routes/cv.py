"""
CV Refine route - Uses Gemini to tailor a JSON Resume to a job description.
"""

from flask import Blueprint, request, jsonify
from services.gemini import _generate_content_text
import json

cv_bp = Blueprint("cv", __name__)


@cv_bp.route("/cv/refine", methods=["POST"])
def refine_cv():
    """Refine a JSON Resume to better match a job description using Gemini."""
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
- "changelog": an array of 2-5 short strings describing what was changed (e.g. "Added 'Project Management' to skills", "Quantified last role's impact by 15%")

Do NOT include any markdown formatting, code blocks, or explanation. Return ONLY the JSON object."""

    try:
        raw = _generate_content_text(prompt)
        
        # Clean up markdown code blocks if present
        cleaned = raw
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

        result = json.loads(cleaned)
        
        return jsonify({
            "refined_cv": result.get("refined_cv", current_cv),
            "changelog": result.get("changelog", ["CV has been refined for this role"]),
        })
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned invalid JSON. Please try again."}), 500
    except Exception as e:
        return jsonify({"error": f"Refinement failed: {str(e)}"}), 500
