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


def generate_interview_prep(application_id: str, job_title: str = "", company: str = "", job_description: str = "", cv_text: str = "") -> dict:
    """
    Generate interview preparation materials based on CV and job description.
    
    Args:
        application_id: The application identifier
        job_title: Optional job title
        company: Optional company name
        job_description: Required job description
        cv_text: Optional CV content for personalization
    
    Returns:
        dict with questions list
    """
    # Input validation
    if not job_description or len(job_description.strip()) < 50:
        return {
            "questions": [],
            "error": "Job description is required and must be at least 50 characters"
        }
    
    model = get_model()
    
    # Build a more detailed prompt when CV is available
    cv_section = ""
    if cv_text and len(cv_text.strip()) > 50:
        cv_section = f"""
    Candidate's CV/Resume:
    {cv_text[:3000]}  # Limit CV text to prevent token overflow
    
    Focus on the overlap between the candidate's experience and the job requirements.
    """
    
    prompt = f"""
    You are an expert interview coach. Generate 5 interview preparation questions for a candidate.
    
    Job Title: {job_title if job_title else "Not specified"}
    Company: {company if company else "Not specified"}
    
    Job Description:
    {job_description[:4000]}  # Limit to prevent token overflow
    {cv_section}
    
    Generate exactly 5 questions that are likely to be asked in an interview for this position.
    Include a mix of:
    - 2 behavioral questions (STAR format situations)
    - 2 technical/role-specific questions
    - 1 situational/problem-solving question
    
    Provide your response in the following JSON format only, no other text:
    {{
        "questions": [
            {{
                "question": "<the interview question>",
                "what_they_test": "<what skill or trait this question evaluates>",
                "talking_points": ["<suggested answer point 1>", "<suggested answer point 2>", "<suggested answer point 3>"]
            }}
        ]
    }}
    
    Make the talking points specific and actionable. Only return valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Try to extract JSON from the response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            response_text = json_match.group()
        
        result = json.loads(response_text)
        
        questions = result.get("questions", [])
        if not questions:
            raise ValueError("No questions in response")
        
        # Ensure we have exactly 5 questions with valid structure
        validated_questions = []
        for q in questions[:5]:
            if isinstance(q, dict) and q.get("question"):
                validated_questions.append({
                    "question": str(q.get("question", "")),
                    "what_they_test": str(q.get("what_they_test", "General assessment")),
                    "talking_points": [str(tp) for tp in q.get("talking_points", ["Prepare your response"])[:4]]
                })
        
        if len(validated_questions) < 3:
            raise ValueError("Too few valid questions generated")
        
        return {"questions": validated_questions}
        
    except json.JSONDecodeError as e:
        print(f"Gemini JSON parse error: {e}")
        print(f"Response was: {response.text[:500] if response else 'No response'}")
        return {
            "questions": [
                {
                    "question": "Tell me about yourself and your experience relevant to this role.",
                    "what_they_test": "Communication and self-presentation",
                    "talking_points": ["Professional background summary", "Key achievements relevant to the role", "Why you're interested in this position"]
                },
                {
                    "question": "What interests you about this position?",
                    "what_they_test": "Motivation and company research",
                    "talking_points": ["Specific aspects of the role that excite you", "How it aligns with your career goals", "What you know about the company"]
                },
                {
                    "question": "Describe a challenging situation you faced and how you handled it.",
                    "what_they_test": "Problem-solving and resilience",
                    "talking_points": ["Situation context", "Actions you took", "Results achieved"]
                },
                {
                    "question": "Where do you see yourself in 5 years?",
                    "what_they_test": "Career planning and ambition",
                    "talking_points": ["Growth trajectory", "Skills you want to develop", "How this role fits your plans"]
                },
                {
                    "question": "Do you have any questions for us?",
                    "what_they_test": "Engagement and preparation",
                    "talking_points": ["Ask about team culture", "Inquire about growth opportunities", "Ask about success metrics"]
                }
            ]
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
