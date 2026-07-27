"""
routes/extension.py
-------------------
POST /api/extension/autofill

Called by the browser extension when the user clicks "Smart Fill Form".
The extension sends ONLY field descriptors (no resume text).
We load the user's profile from DB, build a compact profile summary,
then call the LLM to map fields → values.

This means:
  - API key never leaves the server  ✓
  - We send ~200 tokens of profile instead of 2,000+ tokens of raw resume  ✓
  - Response is faster and cheaper  ✓
"""

import json
import re
from flask import Blueprint, request, jsonify, g
from services.auth import require_auth
from services.ai import _generate_content_text
from services.subscription import require_feature
from database import get_db_helper

extension_bp = Blueprint("extension", __name__)


@extension_bp.route("/extension/autofill", methods=["POST"])
@require_auth
@require_feature("autofill")
def autofill():
    """
    Body JSON:
        {
          "fields": [
            { "index": 0, "type": "text", "name": "firstName",
              "label": "First Name", "placeholder": "", "required": true }
          ],
          "job_context": { "title": "...", "company": "...", "url": "..." }
        }

    Returns:
        { "suggestions": [{ "index": 0, "suggestedValue": "Jane", "confidence": "high" }] }
    """
    data = request.get_json(silent=True) or {}
    fields      = data.get("fields", [])
    job_context = data.get("job_context", {})

    if not fields:
        return jsonify({"error": "No fields provided"}), 400

    db      = get_db_helper()
    user    = db.get_user_by_id(g.user_id)
    profile = db.get_profile(g.user_id) or {}

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Build a compact profile summary — no full resume text sent to LLM
    name       = profile.get("full_name") or user.get("full_name") or user.get("email", "").split("@")[0]
    name_parts = name.split()
    first      = name_parts[0] if name_parts else ""
    last       = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

    skills_list = profile.get("skills", [])
    skills_str  = ", ".join(skills_list[:12]) if isinstance(skills_list, list) else str(skills_list)

    compact_profile = {
        "first_name":    first,
        "last_name":     last,
        "full_name":     name,
        "email":         user.get("email", ""),
        "phone":         profile.get("phone", ""),
        "city":          profile.get("city") or profile.get("location", ""),
        "state":         profile.get("state", ""),
        "country":       profile.get("country", ""),
        "address":       profile.get("address", ""),
        "zip":           profile.get("zip_code", ""),
        "linkedin_url":  profile.get("linkedin_url", ""),
        "github_url":    profile.get("github_url", ""),
        "portfolio_url": profile.get("portfolio_url", ""),
        "job_title":     profile.get("job_title") or profile.get("headline")
                         or next(iter(profile.get("job_titles") or []), ""),
        "summary":       (profile.get("summary") or profile.get("bio") or "")[:300],
        "skills":        skills_str,
        "job_titles":    profile.get("job_titles", []),
        "tools":         profile.get("tools", []),
        "education":     profile.get("education", []),
        "work_experience": profile.get("work_experience", []),
        "certifications": profile.get("certifications", []),
        "projects":      profile.get("projects", []),
        "languages":     profile.get("languages", []),
        "years_of_experience": profile.get("years_of_experience"),
        "additional_details": profile.get("additional_details", {}),
    }

    suggestions = _fill_with_llm(fields, compact_profile, job_context)
    return jsonify({"suggestions": suggestions})


def _fill_with_llm(fields, profile, job_context):
    """Use rules first, then spend AI quota only on unresolved fields."""
    rule_results = _rule_based(fields, profile)
    resolved = {
        item["index"]: item for item in rule_results
        if item.get("suggestedValue") is not None
    }
    unresolved = [f for f in fields if f.get("index") not in resolved]
    if not unresolved:
        return [resolved[f["index"]] for f in fields]

    fields_desc = json.dumps(
        [{"index": f["index"], "label": f.get("label",""), "name": f.get("name",""),
          "placeholder": f.get("placeholder",""), "type": f.get("type","text"),
          "required": f.get("required", False)}
         for f in unresolved],
        ensure_ascii=False
    )

    job_info = ""
    if job_context.get("title"):
        job_info = f'\nJob: {job_context.get("title","?")} at {job_context.get("company","?")}'

    prompt = f"""You are helping autofill a job application form.{job_info}

User profile (compact):
{json.dumps(profile, ensure_ascii=False, indent=2)}

Form fields:
{fields_desc}

For each field return the best value from the profile.
- Return ONLY a JSON object, no markdown, no explanation.
- Use null for fields you cannot fill confidently.
- Never infer or invent qualifications, dates, employers, education, salary,
  work authorization, sponsorship, demographic, disability, or veteran answers.
- Always return null for sensitive self-identification, legal, salary,
  sponsorship, and work-authorization questions.
- A plausible answer is not enough: it must be explicitly supported by the profile.
- For cover letter / summary fields use profile.summary (max 300 chars).
- For skills fields join the skills with commas.

JSON format:
{{"suggestions": [{{"index": 0, "suggestedValue": "value or null", "confidence": "high|medium|low"}}]}}"""

    try:
        raw = _generate_content_text(prompt, json_mode=True)
        payload = json.loads(raw)
        ai_suggestions = payload.get("suggestions", [])
        allowed_indexes = {f.get("index") for f in unresolved}
        for item in ai_suggestions:
            index = item.get("index")
            confidence = item.get("confidence")
            if index not in allowed_indexes or confidence not in {"high", "medium", "low"}:
                continue
            value = item.get("suggestedValue")
            if value is not None and not isinstance(value, (str, int, float, bool)):
                continue
            resolved[index] = {
                "index": index,
                "suggestedValue": value,
                "confidence": confidence,
            }
    except Exception as e:
        print(f"[Extension/autofill] AI error: {e}")

    by_index = {item["index"]: item for item in rule_results}
    by_index.update(resolved)
    return [by_index[f["index"]] for f in fields]

def _rule_based(fields, profile):
    """Simple deterministic fallback — no LLM needed."""
    results = []
    first = profile.get("first_name", "")
    last  = profile.get("last_name",  "")

    for f in fields:
        key = f"{f.get('label','')} {f.get('name','')} {f.get('placeholder','')}".lower()
        normalized = re.sub(r"[^a-z0-9]+", " ", key).strip()
        val = None

        if re.search(r"\b(e mail|email)( address)?\b", normalized): val = profile.get("email")
        elif re.search(r"\b(phone|mobile|telephone)( number)?\b", normalized): val = profile.get("phone")
        elif re.search(r"\bfirst name\b", normalized):             val = first
        elif re.search(r"\b(last name|surname)\b", normalized):    val = last
        elif re.search(r"\bfull name\b", normalized):              val = profile.get("full_name")
        elif re.fullmatch(r"(applicant |candidate |legal |preferred )?name( value)?", normalized):
            val = profile.get("full_name")
        elif re.search(r"\bcity\b", normalized):                   val = profile.get("city")
        elif re.search(r"\b(street )?address\b", normalized):      val = profile.get("address")
        elif re.search(r"\b(state|province|region)\b", normalized): val = profile.get("state")
        elif re.search(r"\b(zip|postal)( code)?\b", normalized):   val = profile.get("zip")
        elif re.search(r"\bcountry\b", normalized):                val = profile.get("country")
        elif re.search(r"\blinkedin\b", normalized):               val = profile.get("linkedin_url")
        elif re.search(r"\bgithub\b", normalized):                 val = profile.get("github_url")
        elif re.search(r"\b(portfolio|personal website)\b", normalized): val = profile.get("portfolio_url")
        elif re.search(r"\bskills?\b", normalized):                val = profile.get("skills")
        elif re.search(r"\b(professional summary|cover letter|about me|biography|bio)\b", normalized):
            val = profile.get("summary")
        elif re.search(r"\b(current|most recent|desired) (job )?(title|position|role)\b", normalized):
            val = profile.get("job_title")

        results.append({
            "index":          f["index"],
            "suggestedValue": val or None,
            "confidence":     "high" if val else "low",
        })

    return results
