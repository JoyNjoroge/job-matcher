"""Evidence-grounded browser-extension autofill."""

import json
import re

from flask import Blueprint, g, jsonify, request

from database import get_db_helper
from services.ai import _generate_content_text
from services.auth import require_auth
from services.subscription import require_feature

extension_bp = Blueprint("extension", __name__)

MAX_FIELDS = 80
MAX_RAW_RESUME_CHARS = 9000
MAX_JOB_DESCRIPTION_CHARS = 6000

SENSITIVE_PATTERN = re.compile(
    r"\b(gender|sex|race|ethni|disab|veteran|military|pronoun|religion|"
    r"marital|criminal|felony|salary|compensation|work authori|sponsor|visa|"
    r"citizen|nationality|demographic)\w*",
    re.IGNORECASE,
)
AVAILABILITY_PATTERN = re.compile(
    r"\b(available|availability|start date|notice period|relocat)\w*",
    re.IGNORECASE,
)
TECHNICAL_LIST_PATTERN = re.compile(
    r"\b(which|what).{0,60}\b(database|data model|modeling approach|cloud "
    r"platform|warehouse|lakehouse|programming language|framework|tool|"
    r"technolog|software)\w*",
    re.IGNORECASE,
)
EVIDENCE_REQUIRED_PATTERN = re.compile(
    r"\b(experience|implemented|used|worked with|proficient|familiar|"
    r"education|degree|qualification|certification|project|achievement)\b",
    re.IGNORECASE,
)
SYNTHESIS_PATTERN = re.compile(
    r"\b(why|interest|motivat|cover letter|tell us about yourself|"
    r"why should|what excites|why do you want)\w*",
    re.IGNORECASE,
)


def _normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _searchable_field_text(field):
    return _normalize_text(
        " ".join(
            str(field.get(key, "") or "")
            for key in ("label", "name", "placeholder", "context")
        )
    ).lower()


def _has_current_value(field):
    value = field.get("currentValue")
    if isinstance(value, list):
        return any(_normalize_text(item) for item in value)
    if isinstance(value, bool):
        return value
    return bool(_normalize_text(value))


def _is_sensitive(field):
    return bool(SENSITIVE_PATTERN.search(_searchable_field_text(field)))


def _explicit_additional_detail(profile, field):
    """Return an explicitly saved answer for availability-like fields."""
    field_text = _searchable_field_text(field)
    details = profile.get("additional_details") or {}
    if not isinstance(details, dict):
        return None

    for key, value in details.items():
        normalized_key = _normalize_text(key).lower()
        if not normalized_key or value in (None, "", []):
            continue
        if normalized_key in field_text or field_text in normalized_key:
            return value

    if AVAILABILITY_PATTERN.search(field_text):
        for key in ("availability", "available_to_start", "start_date", "notice_period"):
            if details.get(key) not in (None, "", []):
                return details[key]
    return None


def _select_supported_value(value, field):
    """Map an AI/rule value onto an employer-provided select option."""
    options = field.get("options") or []
    if not options or value is None:
        return value
    if isinstance(value, (list, dict)):
        return None

    candidate = _normalize_text(value).lower()
    for option in options:
        if option.get("disabled"):
            continue
        option_value = _normalize_text(option.get("value"))
        option_label = _normalize_text(option.get("label"))
        if candidate in {option_value.lower(), option_label.lower()}:
            return option_value or option_label
    return None


def _load_primary_resume(db, user_id):
    try:
        resumes = db.get_resumes(user_id) or []
        primary = next((item for item in resumes if item.get("is_primary")), None)
        resume = primary or (resumes[0] if resumes else {})
        return {
            "parsed": resume.get("parsed_json") or {},
            "raw_text": _normalize_text(resume.get("raw_text"))[:MAX_RAW_RESUME_CHARS],
        }
    except Exception as error:
        print(f"[Extension/autofill] Resume load error: {error}")
        return {"parsed": {}, "raw_text": ""}


def _build_profile(user, profile):
    name = (
        profile.get("full_name")
        or user.get("full_name")
        or user.get("email", "").split("@")[0]
    )
    parts = name.split()
    skills = profile.get("skills") or []
    skills_value = ", ".join(str(item) for item in skills) if isinstance(skills, list) else str(skills)

    return {
        "first_name": parts[0] if parts else "",
        "last_name": " ".join(parts[1:]) if len(parts) > 1 else "",
        "full_name": name,
        "email": user.get("email", ""),
        "phone": profile.get("phone", ""),
        "address_line1": profile.get("address_line1") or profile.get("address", ""),
        "address_line2": profile.get("address_line2", ""),
        "city": profile.get("city", ""),
        "state": profile.get("state", ""),
        "postal_code": profile.get("postal_code") or profile.get("zip_code", ""),
        "country": profile.get("country", ""),
        "location": profile.get("location", ""),
        "linkedin_url": profile.get("linkedin_url", ""),
        "github_url": profile.get("github_url", ""),
        "portfolio_url": profile.get("portfolio_url", ""),
        "job_title": (
            profile.get("job_title")
            or profile.get("headline")
            or next(iter(profile.get("job_titles") or []), "")
        ),
        "summary": (profile.get("summary") or profile.get("bio") or "")[:600],
        "skills": skills_value,
        "job_titles": profile.get("job_titles") or [],
        "tools": profile.get("tools") or [],
        "education": profile.get("education") or [],
        "work_experience": profile.get("work_experience") or [],
        "certifications": profile.get("certifications") or [],
        "projects": profile.get("projects") or [],
        "languages": profile.get("languages") or [],
        "years_of_experience": profile.get("years_of_experience"),
        "additional_details": profile.get("additional_details") or {},
    }


@extension_bp.route("/extension/autofill", methods=["POST"])
@require_auth
@require_feature("autofill")
def autofill():
    data = request.get_json(silent=True) or {}
    fields = data.get("fields") or []
    job_context = data.get("job_context") or {}

    if not isinstance(fields, list) or not fields:
        return jsonify({"error": "No fields provided"}), 400
    if len(fields) > MAX_FIELDS:
        return jsonify({"error": f"At most {MAX_FIELDS} fields can be scanned at once"}), 400

    db = get_db_helper()
    user = db.get_user_by_id(g.user_id)
    profile_row = db.get_profile(g.user_id) or {}
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = _build_profile(user, profile_row)
    resume = _load_primary_resume(db, g.user_id)
    suggestions = _fill_with_llm(fields, profile, job_context, resume)
    return jsonify({"suggestions": suggestions})


def _base_result(field, value=None, confidence="low", **metadata):
    result = {
        "index": field["index"],
        "suggestedValue": value,
        "confidence": confidence,
        "answerMode": metadata.get("answerMode", "unsupported"),
        "sourceEvidence": metadata.get("sourceEvidence"),
        "reason": metadata.get("reason", ""),
    }
    return result


def _first_mapping(values):
    if not isinstance(values, list):
        return {}
    return next((item for item in values if isinstance(item, dict)), {})


def _rule_based(fields, profile):
    """Fill only fields with one unambiguous saved-profile value."""
    results = []
    education = _first_mapping(profile.get("education"))
    experience = _first_mapping(profile.get("work_experience"))

    for field in fields:
        key = re.sub(r"[^a-z0-9]+", " ", _searchable_field_text(field)).strip()
        value = None
        source = None

        if _has_current_value(field):
            results.append(_base_result(
                field,
                answerMode="existing",
                reason="Already completed; kept unchanged.",
            ))
            continue

        explicit_detail = _explicit_additional_detail(profile, field)
        if explicit_detail is not None and not _is_sensitive(field):
            value, source = explicit_detail, "profile.additional_details"
        elif _is_sensitive(field):
            results.append(_base_result(
                field,
                answerMode="sensitive",
                reason="Sensitive or legal answer requires your review.",
            ))
            continue
        elif AVAILABILITY_PATTERN.search(key) and explicit_detail is None:
            results.append(_base_result(
                field,
                answerMode="unsupported",
                reason="Availability is not explicitly saved in your profile.",
            ))
            continue
        elif re.search(r"\b(e mail|email)( address)?\b", key):
            value, source = profile.get("email"), "profile.email"
        elif re.search(r"\b(phone|mobile|telephone)( number)?\b", key):
            value, source = profile.get("phone"), "profile.phone"
        elif re.search(r"\bfirst name\b", key):
            value, source = profile.get("first_name"), "profile.full_name"
        elif re.search(r"\b(last name|surname)\b", key):
            value, source = profile.get("last_name"), "profile.full_name"
        elif re.search(r"\bfull name\b", key):
            value, source = profile.get("full_name"), "profile.full_name"
        elif re.fullmatch(r"(applicant |candidate |legal |preferred )?name( value)?", key):
            value, source = profile.get("full_name"), "profile.full_name"
        elif re.search(r"\b(address line 2|apartment|suite|unit)\b", key):
            value, source = profile.get("address_line2"), "profile.address_line2"
        elif re.search(r"\b(street |home |mailing )?address( line 1)?\b", key):
            value, source = profile.get("address_line1"), "profile.address_line1"
        elif re.search(r"\bcity\b", key):
            value, source = profile.get("city"), "profile.city"
        elif re.search(r"\b(state|province|county|region)\b", key):
            value, source = profile.get("state"), "profile.state"
        elif re.search(r"\b(zip|postal)( code)?\b", key):
            value, source = profile.get("postal_code"), "profile.postal_code"
        elif re.search(r"\bcountry\b", key):
            value, source = profile.get("country"), "profile.country"
        elif re.search(r"\blinkedin\b", key):
            value, source = profile.get("linkedin_url"), "profile.linkedin_url"
        elif re.search(r"\bgithub\b", key):
            value, source = profile.get("github_url"), "profile.github_url"
        elif re.search(r"\b(portfolio|personal website)\b", key):
            value, source = profile.get("portfolio_url"), "profile.portfolio_url"
        elif re.fullmatch(r".*\b(school|university|institution)( name)?\b.*", key):
            value = education.get("institution") or education.get("school")
            source = "profile.education"
        elif re.fullmatch(r".*\b(degree|qualification)( name| type)?\b.*", key):
            value, source = education.get("degree"), "profile.education"
        elif re.fullmatch(r".*\b(field of study|major)\b.*", key):
            value = education.get("field") or education.get("area")
            source = "profile.education"
        elif re.fullmatch(r".*\b(current|most recent) (company|employer)\b.*", key):
            value = experience.get("company") or experience.get("name")
            source = "profile.work_experience"
        elif re.fullmatch(r".*\b(current|most recent|desired) (job )?(title|position|role)\b.*", key):
            value = (
                experience.get("title")
                or experience.get("position")
                or profile.get("job_title")
            )
            source = "profile.work_experience"
        elif re.fullmatch(r".*\b(years of (professional )?experience|total experience)\b.*", key):
            value, source = profile.get("years_of_experience"), "profile.years_of_experience"
        elif re.fullmatch(r".*\bskills?\b.*", key) and not EVIDENCE_REQUIRED_PATTERN.search(key):
            value, source = profile.get("skills"), "profile.skills"
        elif re.search(r"\b(professional summary|about me|biography|bio)\b", key):
            value, source = profile.get("summary"), "profile.summary"

        value = _select_supported_value(value, field)
        if value not in (None, "", []):
            results.append(_base_result(
                field,
                value=value,
                confidence="high",
                answerMode="profile",
                sourceEvidence=source,
                reason="Exact value from your saved profile.",
            ))
        else:
            results.append(_base_result(field))
    return results


def _evidence_blob(profile, resume):
    return _normalize_text(
        json.dumps(profile, ensure_ascii=False, default=str)
        + " "
        + json.dumps(resume.get("parsed") or {}, ensure_ascii=False, default=str)
        + " "
        + (resume.get("raw_text") or "")
    ).lower()


def _quote_is_grounded(quote, evidence_blob):
    normalized = _normalize_text(quote).lower().strip("\"'")
    return len(normalized) >= 3 and normalized in evidence_blob


def _technical_list_is_grounded(value, evidence_blob, forbidden_entities=None):
    if not isinstance(value, str):
        return False
    items = [
        re.sub(r"^(i (have )?(used|worked with)|experience with)\s+", "", item.strip(), flags=re.I)
        for item in re.split(r"[,;\n]|\band\b", value)
        if item.strip()
    ]
    forbidden = forbidden_entities or set()
    return bool(items) and all(
        len(_normalize_text(item)) >= 2
        and _normalize_text(item).lower().strip(".") in evidence_blob
        and _normalize_text(item).lower().strip(".") not in forbidden
        for item in items
    )


def _validate_ai_suggestion(item, field, evidence_blob, forbidden_entities=None):
    value = item.get("suggestedValue")
    if value is not None and not isinstance(value, (str, int, float, bool)):
        return _base_result(field, reason="AI returned an unsupported value type.")
    if value in (None, ""):
        return _base_result(
            field,
            answerMode="unsupported",
            reason=_normalize_text(item.get("reason")) or "No supported answer was found.",
        )

    field_text = _searchable_field_text(field)
    answer_mode = item.get("answerMode")
    evidence = _normalize_text(item.get("sourceEvidence"))
    reason = _normalize_text(item.get("reason"))[:240]
    confidence = item.get("confidence")

    if answer_mode not in {"resume_evidence", "profile", "synthesized"}:
        return _base_result(field, reason="Answer was not tied to an approved source.")
    if confidence not in {"high", "medium", "low"}:
        confidence = "low"
    if _is_sensitive(field) or _has_current_value(field):
        return _base_result(field, reason="This field must remain unchanged.")

    requires_evidence = bool(
        EVIDENCE_REQUIRED_PATTERN.search(field_text)
        or TECHNICAL_LIST_PATTERN.search(field_text)
    )
    factual_mode_without_evidence = (
        answer_mode in {"resume_evidence", "profile"}
        and not _quote_is_grounded(evidence, evidence_blob)
    )
    if requires_evidence and answer_mode == "synthesized":
        factual_mode_without_evidence = True
    if factual_mode_without_evidence:
        return _base_result(
            field,
            reason="No exact supporting resume evidence was found.",
        )
    if TECHNICAL_LIST_PATTERN.search(field_text) and not _technical_list_is_grounded(
        str(value), evidence_blob, forbidden_entities
    ):
        return _base_result(
            field,
            reason="The proposed tools were not all present in your resume.",
        )
    if answer_mode == "synthesized" and not SYNTHESIS_PATTERN.search(field_text):
        return _base_result(
            field,
            reason="Synthesis is not allowed for factual experience questions.",
        )

    value = _select_supported_value(value, field)
    if value is None:
        return _base_result(
            field,
            reason="The answer did not match an available form option.",
        )

    return _base_result(
        field,
        value=value,
        confidence="medium" if answer_mode == "synthesized" else confidence,
        answerMode=answer_mode,
        sourceEvidence=evidence or None,
        reason=reason or (
            "Drafted from your resume and the job description."
            if answer_mode == "synthesized"
            else "Supported by your saved resume."
        ),
    )


def _nontechnical_entities(profile, resume):
    """Values that must never be mistaken for tools/technical approaches."""
    values = []
    values.extend(profile.get("job_titles") or [])
    values.append(profile.get("job_title"))
    for item in (profile.get("work_experience") or []):
        if isinstance(item, dict):
            values.extend([
                item.get("title"),
                item.get("position"),
                item.get("role"),
                item.get("company"),
            ])
    for item in (profile.get("education") or []):
        if isinstance(item, dict):
            values.extend([
                item.get("institution"),
                item.get("school"),
                item.get("degree"),
            ])
    parsed = resume.get("parsed") or {}
    for item in (parsed.get("work_experience") or parsed.get("experience") or []):
        if isinstance(item, dict):
            values.extend([item.get("title"), item.get("role"), item.get("company")])
    return {
        _normalize_text(value).lower().strip(".")
        for value in values
        if _normalize_text(value)
    }


def _fill_with_llm(fields, profile, job_context, resume=None):
    """Use exact rules first, then AI only for unresolved questions."""
    resume = resume or {"parsed": {}, "raw_text": ""}
    rule_results = _rule_based(fields, profile)
    by_index = {item["index"]: item for item in rule_results}
    unresolved = [
        field for field in fields
        if by_index[field["index"]].get("answerMode") == "unsupported"
        and not _has_current_value(field)
        and not _is_sensitive(field)
        and not AVAILABILITY_PATTERN.search(_searchable_field_text(field))
    ]
    if not unresolved:
        return [by_index[field["index"]] for field in fields]

    descriptors = [
        {
            "index": field["index"],
            "label": field.get("label", ""),
            "name": field.get("name", ""),
            "context": field.get("context", ""),
            "placeholder": field.get("placeholder", ""),
            "type": field.get("type", "text"),
            "required": field.get("required", False),
            "options": field.get("options") or [],
        }
        for field in unresolved
    ]
    bounded_job_context = {
        "title": _normalize_text(job_context.get("title"))[:200],
        "company": _normalize_text(job_context.get("company"))[:200],
        "description": _normalize_text(job_context.get("description"))[
            :MAX_JOB_DESCRIPTION_CHARS
        ],
    }

    prompt = f"""You draft truthful job-application answers.

CANDIDATE PROFILE:
{json.dumps(profile, ensure_ascii=False, indent=2, default=str)}

PARSED PRIMARY RESUME:
{json.dumps(resume.get("parsed") or {}, ensure_ascii=False, indent=2, default=str)}

PRIMARY RESUME TEXT:
{resume.get("raw_text") or "(not available)"}

TARGET JOB (context only; never use its requirements as candidate evidence):
{json.dumps(bounded_job_context, ensure_ascii=False, indent=2)}

UNRESOLVED FORM FIELDS:
{json.dumps(descriptors, ensure_ascii=False, indent=2)}

For every field:
- Use "resume_evidence" or "profile" for factual answers. sourceEvidence MUST
  be a short exact quote copied from the candidate profile/resume above.
- For questions asking which databases, platforms, tools, modeling approaches,
  or technologies were used, return only a concise comma-separated list of
  items explicitly present in candidate evidence. Never substitute a job title,
  employer, desired skill, or requirement from the target job.
- "synthesized" is allowed only for motivation/interest/why-us questions. It
  may combine truthful resume facts with target-job context and has medium confidence.
- Return null with answerMode "unsupported" whenever evidence is missing.
- Never infer dates, availability, relocation, salary, authorization,
  sponsorship, legal answers, or demographic/self-identification answers.
- For select fields, return exactly one non-disabled option value or label.
- Keep textarea answers concise (normally 1-3 sentences).

Return ONLY JSON:
{{"suggestions":[{{
  "index":0,
  "suggestedValue":"value or null",
  "confidence":"high|medium|low",
  "answerMode":"resume_evidence|profile|synthesized|unsupported",
  "sourceEvidence":"exact quote or null",
  "reason":"short user-facing explanation"
}}]}}"""

    evidence_blob = _evidence_blob(profile, resume)
    forbidden_entities = _nontechnical_entities(profile, resume)
    try:
        raw = _generate_content_text(prompt, json_mode=True, max_tokens=4096)
        payload = json.loads(raw)
        allowed = {field["index"]: field for field in unresolved}
        for item in payload.get("suggestions") or []:
            index = item.get("index")
            if index not in allowed:
                continue
            by_index[index] = _validate_ai_suggestion(
                item,
                allowed[index],
                evidence_blob,
                forbidden_entities,
            )
    except Exception as error:
        print(f"[Extension/autofill] AI error: {error}")

    return [by_index[field["index"]] for field in fields]
