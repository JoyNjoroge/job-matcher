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

import os
import json
from flask import Blueprint, request, jsonify, g
from services.auth import require_auth
from services.subscription import require_feature
from database import get_db_helper

try:
    import anthropic
    _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    LLM_BACKEND = "anthropic"
except Exception:
    _client = None
    LLM_BACKEND = "none"

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
        "job_title":     profile.get("job_title") or profile.get("headline", ""),
        "summary":       (profile.get("summary") or profile.get("bio") or "")[:300],
        "skills":        skills_str,
    }

    suggestions = _fill_with_llm(fields, compact_profile, job_context)
    return jsonify({"suggestions": suggestions})


def _fill_with_llm(fields, profile, job_context):
    """Call LLM to map form fields to profile values. Falls back to rules."""
    if not _client or LLM_BACKEND == "none":
        return _rule_based(fields, profile)

    fields_desc = json.dumps(
        [{"index": f["index"], "label": f.get("label",""), "name": f.get("name",""),
          "placeholder": f.get("placeholder",""), "type": f.get("type","text"),
          "required": f.get("required", False)}
         for f in fields],
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
- Return ONLY a JSON array, no markdown, no explanation.
- Use null for fields you cannot fill confidently.
- For cover letter / summary fields use profile.summary (max 300 chars).
- For skills fields join the skills with commas.

JSON array format:
[{{"index": 0, "suggestedValue": "value or null", "confidence": "high|medium|low"}}]"""

    try:
        msg = _client.messages.create(
            model="claude-haiku-4-5-20251001",   # fast + cheap for this task
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        raw  = msg.content[0].text.strip()
        # Strip possible markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        print(f"[Extension/autofill] LLM error: {e}")
        return _rule_based(fields, profile)


def _rule_based(fields, profile):
    """Simple deterministic fallback — no LLM needed."""
    results = []
    first = profile.get("first_name", "")
    last  = profile.get("last_name",  "")

    for f in fields:
        key = f"{f.get('label','')} {f.get('name','')} {f.get('placeholder','')}".lower()
        val = None

        if   "email" in key or "e-mail" in key:             val = profile.get("email")
        elif "phone" in key or "mobile" in key or "tel" in key: val = profile.get("phone")
        elif "first" in key and "name" in key:               val = first
        elif "last"  in key and "name" in key:               val = last
        elif "full"  in key and "name" in key:               val = profile.get("full_name")
        elif "name"  in key:                                 val = profile.get("full_name")
        elif "city"  in key:                                 val = profile.get("city")
        elif "address" in key:                               val = profile.get("address")
        elif "state" in key or "province" in key:            val = profile.get("state")
        elif "zip"   in key or "postal" in key:              val = profile.get("zip")
        elif "country" in key:                               val = profile.get("country")
        elif "linkedin" in key:                              val = profile.get("linkedin_url")
        elif "github"   in key:                              val = profile.get("github_url")
        elif "portfolio" in key or "website" in key:         val = profile.get("portfolio_url")
        elif "skill"    in key:                              val = profile.get("skills")
        elif "summary"  in key or "cover" in key or "about" in key or "bio" in key:
            val = profile.get("summary")
        elif "title" in key or "position" in key or "role" in key:
            val = profile.get("job_title")

        results.append({
            "index":          f["index"],
            "suggestedValue": val or None,
            "confidence":     "high" if val else "low",
        })

    return results
