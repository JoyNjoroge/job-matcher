"""
Gemini AI Service - Handles all AI-powered analysis and generation.
"""

import os
import json
import google.generativeai as genai

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def get_model():
    """Get the Gemini model instance."""
    return genai.GenerativeModel("gemini-pro")


def analyze_job_fit(cv_content: str, job_description: str, job_title: str = "", company: str = "") -> dict:
    """
    Analyze how well a CV matches a job description.
    
    Args:
        cv_content: Parsed text content from CV
        job_description: Job posting description
        job_title: Optional job title
        company: Optional company name
    
    Returns:
        dict with fit_score, interview_likelihood, strengths, gaps, red_flags
    """
    model = get_model()
    
    prompt = f"""
    You are an expert HR analyst and career coach. Analyze how well this candidate's CV matches the job description.
    
    CV Content:
    {cv_content}
    
    Job Description:
    {job_description}
    
    {f"Job Title: {job_title}" if job_title else ""}
    {f"Company: {company}" if company else ""}
    
    Provide your analysis in the following JSON format:
    {{
        "fit_score": <number 0-100>,
        "interview_likelihood": "<low|medium|high>",
        "strengths": ["<strength 1>", "<strength 2>", ...],
        "gaps": ["<gap 1>", "<gap 2>", ...],
        "red_flags": ["<red flag 1>", "<red flag 2>", ...]
    }}
    
    Be specific and actionable in your feedback. Only return valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        
        # Validate and sanitize response
        return {
            "fit_score": min(100, max(0, int(result.get("fit_score", 50)))),
            "interview_likelihood": result.get("interview_likelihood", "medium"),
            "strengths": result.get("strengths", [])[:5],
            "gaps": result.get("gaps", [])[:5],
            "red_flags": result.get("red_flags", [])[:3]
        }
    except Exception as e:
        print(f"Gemini analysis error: {e}")
        return {
            "fit_score": 50,
            "interview_likelihood": "medium",
            "strengths": ["Unable to analyze - please try again"],
            "gaps": [],
            "red_flags": []
        }


def generate_application_materials(job_id: str, cv_content: str = "", job_description: str = "") -> dict:
    """
    Generate application materials including email draft and suggestions.
    
    Args:
        job_id: The job identifier
        cv_content: Optional CV content for personalization
        job_description: Optional job description
    
    Returns:
        dict with draft_email, resume_suggestions, ats_notes
    """
    model = get_model()
    
    prompt = f"""
    You are an expert career coach helping a job applicant. Generate application materials.
    
    {"CV Content: " + cv_content if cv_content else ""}
    {"Job Description: " + job_description if job_description else ""}
    
    Provide your response in the following JSON format:
    {{
        "draft_email": "<professional cover letter/email text>",
        "resume_suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
        "ats_notes": ["<ATS optimization tip 1>", "<ATS optimization tip 2>", ...]
    }}
    
    Make the email professional, personalized, and compelling. Only return valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        
        return {
            "draft_email": result.get("draft_email", ""),
            "resume_suggestions": result.get("resume_suggestions", [])[:5],
            "ats_notes": result.get("ats_notes", [])[:5]
        }
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return {
            "draft_email": "Unable to generate email - please try again.",
            "resume_suggestions": [],
            "ats_notes": []
        }


def generate_interview_prep(application_id: str, job_title: str = "", company: str = "", job_description: str = "") -> dict:
    """
    Generate interview preparation materials.
    
    Args:
        application_id: The application identifier
        job_title: Optional job title
        company: Optional company name
        job_description: Optional job description
    
    Returns:
        dict with questions list
    """
    model = get_model()
    
    prompt = f"""
    You are an expert interview coach. Generate interview preparation materials for a candidate.
    
    {f"Job Title: {job_title}" if job_title else ""}
    {f"Company: {company}" if company else ""}
    {f"Job Description: {job_description}" if job_description else ""}
    
    Provide 5-7 likely interview questions in the following JSON format:
    {{
        "questions": [
            {{
                "question": "<interview question>",
                "what_they_test": "<what this question evaluates>",
                "talking_points": ["<point 1>", "<point 2>", "<point 3>"]
            }}
        ]
    }}
    
    Include a mix of behavioral, technical, and situational questions. Only return valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        
        return {
            "questions": result.get("questions", [])[:7]
        }
    except Exception as e:
        print(f"Gemini interview prep error: {e}")
        return {
            "questions": [
                {
                    "question": "Tell me about yourself.",
                    "what_they_test": "Communication and self-presentation",
                    "talking_points": ["Professional background", "Key achievements", "Why this role"]
                }
            ]
        }
