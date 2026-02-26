"""
Gemini AI Service - Handles all AI-powered analysis and generation.
Models: gemini-2.5-flash (primary) -> gemini-2.5-flash-lite (fallback)
Caching: Supabase-backed response cache to save quota
"""

import os
import json
import hashlib
import importlib
import importlib.util
from datetime import datetime, timedelta

# ─── API Key Setup ────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ─── Model Names ─────────────────────────────────────────────────────────────
MODEL_PRIMARY  = "gemini-2.5-flash"
MODEL_FALLBACK = "gemini-2.5-flash-lite-preview-06-17"  # lite fallback
CACHE_TTL_DAYS = 7   # how long cached responses stay fresh


# ─── SDK Loader ──────────────────────────────────────────────────────────────
def _load_gemini_sdk():
    """Load google.genai SDK (new) with fallback to google.generativeai (legacy)."""
    if importlib.util.find_spec("google.genai"):
        return importlib.import_module("google.genai"), True
    if importlib.util.find_spec("google.generativeai"):
        return importlib.import_module("google.generativeai"), False
    raise RuntimeError("No Gemini SDK installed. Run: pip install google-genai")


_GENAI_SDK, _USING_NEW_SDK = _load_gemini_sdk()


def _resolve_api_key() -> str:
    if GOOGLE_API_KEY and GEMINI_API_KEY:
        print("Both GOOGLE_API_KEY and GEMINI_API_KEY set — using GOOGLE_API_KEY.")
        return GOOGLE_API_KEY
    return GOOGLE_API_KEY or GEMINI_API_KEY or ""


_API_KEY = _resolve_api_key()

if _API_KEY:
    _CLIENT = _GENAI_SDK.Client(api_key=_API_KEY) if _USING_NEW_SDK else None
    if not _USING_NEW_SDK:
        _GENAI_SDK.configure(api_key=_API_KEY)
else:
    _CLIENT = None


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _is_quota_error(error: Exception) -> bool:
    """Detect Gemini quota / rate-limit errors."""
    msg = str(error).upper()
    return any(k in msg for k in ("429", "RESOURCE_EXHAUSTED", "RATE_LIMIT", "QUOTA"))


def _unavailable_response(message: str, include_questions: bool = False) -> dict:
    """Standard error payload when Gemini cannot be reached."""
    payload = {"error": message, "error_code": "ai_service_unavailable"}
    if include_questions:
        payload["questions"] = []
    return payload


def _make_cache_key(operation: str, *parts: str) -> str:
    """SHA-256 hash of the operation name + all input strings."""
    combined = operation + "|" + "|".join(parts)
    return hashlib.sha256(combined.encode()).hexdigest()


# ─── Supabase Cache ──────────────────────────────────────────────────────────
def _cache_get(cache_key: str):
    """Return cached JSON result if it exists and is still fresh, else None."""
    try:
        from database import get_supabase
        client = get_supabase()
        cutoff = (datetime.utcnow() - timedelta(days=CACHE_TTL_DAYS)).isoformat()
        result = (
            client.table("ai_response_cache")
            .select("result")
            .eq("cache_key", cache_key)
            .gte("created_at", cutoff)
            .limit(1)
            .execute()
        )
        if result.data:
            print(f"[Cache HIT] {cache_key[:16]}…")
            return result.data[0]["result"]
    except Exception as e:
        print(f"[Cache] Read error (non-fatal): {e}")
    return None


def _cache_set(cache_key: str, operation: str, result: dict) -> None:
    """Upsert a result into the Supabase cache table."""
    try:
        from database import get_supabase
        client = get_supabase()
        client.table("ai_response_cache").upsert({
            "cache_key":  cache_key,
            "operation":  operation,
            "result":     result,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
        print(f"[Cache SET] {cache_key[:16]}…")
    except Exception as e:
        print(f"[Cache] Write error (non-fatal): {e}")


# ─── Core Generation (with model fallback) ───────────────────────────────────
def _generate_content_text(prompt: str) -> str:
    """
    Call Gemini with primary model; fall back to lite on quota errors.
    Returns raw text string.
    """
    if not _API_KEY:
        raise RuntimeError("Gemini API key not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY.")

    for model_name in (MODEL_PRIMARY, MODEL_FALLBACK):
        try:
            print(f"[Gemini] Using model: {model_name}")
            if _USING_NEW_SDK:
                response = _CLIENT.models.generate_content(
                    model=model_name, contents=prompt
                )
            else:
                model = _GENAI_SDK.GenerativeModel(model_name)
                response = model.generate_content(prompt)

            text = (response.text or "").strip()

            # Strip accidental markdown fences
            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            return text.strip()

        except Exception as e:
            if _is_quota_error(e) and model_name == MODEL_PRIMARY:
                print(f"[Gemini] {MODEL_PRIMARY} quota hit — falling back to {MODEL_FALLBACK}")
                continue
            raise  # re-raise for non-quota errors or if fallback also fails

    raise RuntimeError("Both Gemini models exhausted their quota.")


def _parse_json_response(text: str) -> dict:
    """Parse JSON from Gemini response text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Sometimes the model wraps in a json key
        raise ValueError(f"Could not parse Gemini JSON response: {text[:200]}")


# ─── Public Functions ─────────────────────────────────────────────────────────

def analyze_job_fit(
    cv_content: str,
    job_description: str,
    job_title: str = "",
    company: str = "",
) -> dict:
    """Analyze how well a CV matches a job description."""

    cache_key = _make_cache_key("analyze_job_fit", cv_content[:500], job_description[:500])
    cached = _cache_get(cache_key)
    if cached:
        return cached

    prompt = f"""You are an expert HR analyst and career coach.
Analyze how well this candidate's CV matches the job description.

CV Content:
{cv_content}

Job Description:
{job_description}

{f"Job Title: {job_title}" if job_title else ""}
{f"Company: {company}" if company else ""}

Return ONLY valid JSON (no markdown):
{{
    "fit_score": <0-100>,
    "interview_likelihood": "<low|medium|high>",
    "strengths": ["<strength>", ...],
    "gaps": ["<gap>", ...],
    "red_flags": ["<red flag>", ...]
}}"""

    try:
        result = _parse_json_response(_generate_content_text(prompt))
        result = {
            "fit_score":            min(100, max(0, int(result.get("fit_score", 50)))),
            "interview_likelihood": result.get("interview_likelihood", "medium"),
            "strengths":            result.get("strengths", [])[:5],
            "gaps":                 result.get("gaps", [])[:5],
            "red_flags":            result.get("red_flags", [])[:3],
        }
        _cache_set(cache_key, "analyze_job_fit", result)
        return result
    except Exception as e:
        print(f"[analyze_job_fit] Error: {e}")
        if _is_quota_error(e):
            return _unavailable_response("AI quota exceeded. Please try again later.")
        return _unavailable_response("Unable to analyze this job right now.")


def analyze_job_fit_for_briefing(resume_text: str, job_description: str) -> dict:
    """Extended job fit analysis for the briefing/apply page."""

    cache_key = _make_cache_key("briefing_fit", resume_text[:500], job_description[:500])
    cached = _cache_get(cache_key)
    if cached:
        return cached

    prompt = f"""You are an expert career counselor and recruiter.
Analyze how well this candidate's resume matches the job description.

RESUME:
{resume_text[:4000]}

JOB DESCRIPTION:
{job_description[:4000]}

Return ONLY valid JSON:
{{
  "fit_score": <0-100>,
  "recommendation": "<strong_fit|good_fit|fair_fit|poor_fit>",
  "strengths": ["<3-5 matching qualifications>"],
  "gaps": ["<missing or weak qualifications>"],
  "skill_recommendations": ["<actionable suggestions>"],
  "experience_match": "<brief assessment>",
  "message": "<personalized message to candidate>",
  "should_apply": <true|false>
}}

SCORING:
- 80-100: strong_fit  - 60-79: good_fit  - 40-59: fair_fit  - 0-39: poor_fit
should_apply = false ONLY if fit_score < 30 OR missing critical certifications/degrees."""

    try:
        result = _parse_json_response(_generate_content_text(prompt))
        result.setdefault("fit_score", 50)
        result.setdefault("recommendation", "fair_fit")
        result.setdefault("strengths", [])
        result.setdefault("gaps", [])
        result.setdefault("skill_recommendations", [])
        result.setdefault("experience_match", "Unable to assess")
        result.setdefault("message", "Analysis complete")
        result.setdefault("should_apply", result["fit_score"] >= 30)
        _cache_set(cache_key, "briefing_fit", result)
        return result
    except Exception as e:
        print(f"[analyze_job_fit_for_briefing] Error: {e}")
        if _is_quota_error(e):
            return _unavailable_response("AI quota exceeded. Please try again later.")
        return {
            "fit_score": 50, "recommendation": "fair_fit",
            "strengths": ["Unable to analyze — please try again"],
            "gaps": [], "skill_recommendations": [],
            "experience_match": "Unable to assess",
            "message": "We encountered an issue. Please try again.",
            "should_apply": True,
        }


def generate_interview_prep(
    application_id: str,
    job_title: str = "",
    company: str = "",
    job_description: str = "",
    cv_text: str = "",
) -> dict:
    """Generate interview preparation questions and talking points."""

    if not job_description or len(job_description.strip()) < 50:
        return {"questions": [], "error": "Job description required (min 50 chars)"}

    cache_key = _make_cache_key("interview_prep", job_description[:500], cv_text[:300])
    cached = _cache_get(cache_key)
    if cached:
        return cached

    cv_section = f"\nCandidate CV:\n{cv_text[:3000]}" if cv_text and len(cv_text.strip()) > 50 else ""

    prompt = f"""You are an expert interview coach.
Generate 8 targeted interview questions for this role.
{f"Job Title: {job_title}" if job_title else ""}
{f"Company: {company}" if company else ""}

Job Description:
{job_description[:3000]}
{cv_section}

Return ONLY valid JSON:
{{
  "questions": [
    {{
      "question": "<interview question>",
      "what_they_test": "<what skill/trait this evaluates>",
      "talking_points": ["<point 1>", "<point 2>", "<point 3>"]
    }}
  ]
}}"""

    try:
        result = _parse_json_response(_generate_content_text(prompt))
        if not result.get("questions"):
            raise ValueError("Empty questions list")
        _cache_set(cache_key, "interview_prep", result)
        return result
    except Exception as e:
        print(f"[generate_interview_prep] Error: {e}")
        if _is_quota_error(e):
            return _unavailable_response("AI quota exceeded.", include_questions=True)
        return _unavailable_response("Unable to generate interview prep.", include_questions=True)


def generate_application_materials(
    job_id: str,
    cv_content: str = "",
    job_description: str = "",
) -> dict:
    """Generate draft email, resume suggestions, and ATS notes."""

    cache_key = _make_cache_key("app_materials", job_id, job_description[:300])
    cached = _cache_get(cache_key)
    if cached:
        return cached

    prompt = f"""You are an expert career coach.
Generate job application materials.
{"CV Content: " + cv_content if cv_content else ""}
{"Job Description: " + job_description if job_description else ""}

Return ONLY valid JSON:
{{
    "draft_email": "<professional cover letter text>",
    "resume_suggestions": ["<suggestion>", ...],
    "ats_notes": ["<ATS tip>", ...]
}}"""

    try:
        result = _parse_json_response(_generate_content_text(prompt))
        result = {
            "draft_email":        result.get("draft_email", ""),
            "resume_suggestions": result.get("resume_suggestions", [])[:5],
            "ats_notes":          result.get("ats_notes", [])[:5],
        }
        _cache_set(cache_key, "app_materials", result)
        return result
    except Exception as e:
        print(f"[generate_application_materials] Error: {e}")
        if _is_quota_error(e):
            return _unavailable_response("AI quota exceeded. Please try again later.")
        return _unavailable_response("Unable to generate application materials.")


def analyze_resume_match(resume_text: str, job_description: str) -> dict:
    """Structured resume vs job description match analysis."""

    cache_key = _make_cache_key("resume_match", resume_text[:400], job_description[:400])
    cached = _cache_get(cache_key)
    if cached:
        return cached

    prompt = f"""Analyze how well this resume matches the job description.
Return ONLY valid JSON:
{{
    "match_score": <0-100>,
    "matching_skills": ["skill1"],
    "missing_skills": ["skill1"],
    "strengths": ["strength1"],
    "recommendations": ["recommendation1"],
    "overall_assessment": "<brief summary>"
}}

Job Description:
{job_description[:2000]}

Resume:
{resume_text[:2000]}"""

    try:
        result = _parse_json_response(_generate_content_text(prompt))
        _cache_set(cache_key, "resume_match", result)
        return result
    except Exception as e:
        print(f"[analyze_resume_match] Error: {e}")
        return {
            "match_score": 0, "matching_skills": [], "missing_skills": [],
            "strengths": [], "recommendations": [],
            "overall_assessment": "Analysis failed — please try again.",
        }


def generate_cover_letter(
    resume_text: str,
    job_description: str,
    company_name: str,
) -> str:
    """Generate a tailored cover letter. Returns plain text string."""

    cache_key = _make_cache_key("cover_letter", resume_text[:400], job_description[:400], company_name)
    cached = _cache_get(cache_key)
    if cached and isinstance(cached, dict):
        return cached.get("text", "")

    prompt = f"""Write a professional, personalized cover letter (3-4 paragraphs, max 300 words).
Company: {company_name}

Job Description:
{job_description[:1500]}

Candidate Resume:
{resume_text[:1500]}

Return ONLY the cover letter text, no JSON, no markdown."""

    try:
        text = _generate_content_text(prompt)
        _cache_set(cache_key, "cover_letter", {"text": text})
        return text
    except Exception as e:
        print(f"[generate_cover_letter] Error: {e}")
        return ""


def prepare_interview_questions(job_description: str, resume_text: str) -> list:
    """Generate a simple list of 10 interview question strings."""

    cache_key = _make_cache_key("interview_questions", job_description[:400], resume_text[:300])
    cached = _cache_get(cache_key)
    if cached and isinstance(cached, dict):
        return cached.get("questions", [])

    prompt = f"""Generate 10 likely interview questions based on this job and resume.
Return ONLY a valid JSON array of strings (no markdown):
["Question 1?", "Question 2?", ...]

Job Description:
{job_description[:1500]}

Resume:
{resume_text[:1500]}"""

    try:
        result = json.loads(_generate_content_text(prompt))
        questions = result if isinstance(result, list) else []
        _cache_set(cache_key, "interview_questions", {"questions": questions})
        return questions
    except Exception as e:
        print(f"[prepare_interview_questions] Error: {e}")
        return []