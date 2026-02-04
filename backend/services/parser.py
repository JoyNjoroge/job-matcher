"""
Parser Service - Handles CV/resume file parsing.
"""

import io
import re
import json
from PyPDF2 import PdfReader
from docx import Document


def parse_cv(file) -> str:
    """
    Parse CV file and extract text content.
    
    Args:
        file: File object (PDF or DOCX)
    
    Returns:
        Extracted text content as string
    """
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".pdf"):
            return parse_pdf(file)
        elif filename.endswith(".docx"):
            return parse_docx(file)
        else:
            # Try to read as plain text
            return file.read().decode("utf-8")
    except Exception as e:
        print(f"CV parsing error: {e}")
        return ""


def parse_resume_file(file, file_ext: str) -> str:
    """
    Parse resume file by extension.
    
    Args:
        file: File object
        file_ext: File extension (pdf, docx, etc.)
    
    Returns:
        Extracted text content
    """
    try:
        if file_ext == "pdf":
            return parse_pdf(file)
        elif file_ext in ["docx", "doc"]:
            return parse_docx(file)
        else:
            content = file.read()
            if isinstance(content, bytes):
                return content.decode("utf-8")
            return content
    except Exception as e:
        print(f"Resume parsing error: {e}")
        return ""


def parse_pdf(file) -> str:
    """
    Extract text from PDF file.
    
    Args:
        file: PDF file object
    
    Returns:
        Extracted text content
    """
    try:
        reader = PdfReader(io.BytesIO(file.read()))
        text_content = []
        
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        
        return "\n".join(text_content)
    except Exception as e:
        print(f"PDF parsing error: {e}")
        return ""


def parse_docx(file) -> str:
    """
    Extract text from DOCX file.
    
    Args:
        file: DOCX file object
    
    Returns:
        Extracted text content
    """
    try:
        doc = Document(io.BytesIO(file.read()))
        text_content = []
        
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_content.append(paragraph.text)
        
        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    if cell.text.strip():
                        row_text.append(cell.text.strip())
                if row_text:
                    text_content.append(" | ".join(row_text))
        
        return "\n".join(text_content)
    except Exception as e:
        print(f"DOCX parsing error: {e}")
        return ""


def extract_resume_structure(raw_text: str) -> dict:
    """
    Extract structured data from raw resume text.
    Uses pattern matching and heuristics.
    
    Args:
        raw_text: Raw text content from resume
    
    Returns:
        Structured dictionary with resume sections
    """
    structure = {
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "tools": [],
        "certifications": [],
        "years_of_experience": None,
        "seniority_estimation": None,
        "summary": None,
    }
    
    if not raw_text:
        return structure
    
    lines = raw_text.split("\n")
    current_section = None
    
    # Common section headers
    section_patterns = {
        "education": r"(education|academic|qualification|degree)",
        "experience": r"(experience|employment|work history|professional)",
        "skills": r"(skills|technical skills|competencies|expertise)",
        "projects": r"(projects|portfolio|personal projects)",
        "certifications": r"(certifications|certificates|licenses)",
    }
    
    # Extract skills using common patterns
    skills_patterns = [
        r"python|javascript|typescript|java|c\+\+|ruby|go|rust|swift|kotlin",
        r"react|angular|vue|node\.?js|express|django|flask|spring",
        r"aws|azure|gcp|docker|kubernetes|terraform",
        r"sql|postgresql|mysql|mongodb|redis",
        r"git|ci/cd|agile|scrum",
    ]
    
    extracted_skills = set()
    for pattern in skills_patterns:
        matches = re.findall(pattern, raw_text.lower())
        extracted_skills.update(matches)
    
    structure["skills"] = list(extracted_skills)
    
    # Estimate years of experience
    year_patterns = re.findall(r"(\d{4})\s*[-–]\s*(\d{4}|present|current)", raw_text.lower())
    if year_patterns:
        total_years = 0
        current_year = 2024
        for start, end in year_patterns:
            start_year = int(start)
            end_year = current_year if end in ["present", "current"] else int(end)
            total_years += max(0, end_year - start_year)
        
        structure["years_of_experience"] = total_years
        
        # Estimate seniority
        if total_years < 2:
            structure["seniority_estimation"] = "entry"
        elif total_years < 5:
            structure["seniority_estimation"] = "mid"
        elif total_years < 10:
            structure["seniority_estimation"] = "senior"
        else:
            structure["seniority_estimation"] = "lead"
    
    # Extract first paragraph as summary (if looks like a summary)
    first_lines = " ".join(lines[:5]).strip()
    if len(first_lines) > 100 and not any(
        keyword in first_lines.lower() 
        for keyword in ["education", "experience", "skills"]
    ):
        structure["summary"] = first_lines[:500]
    
    return structure


def use_gemini_for_parsing(raw_text: str) -> dict:
    """
    Use Gemini AI for more accurate resume parsing.
    Falls back to pattern matching if Gemini fails.
    
    Args:
        raw_text: Raw text content from resume
    
    Returns:
        Structured dictionary with resume sections
    """
    try:
        import os
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return extract_resume_structure(raw_text)
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-pro")
        
        prompt = f"""
        Parse this resume text and extract structured information.
        Return only valid JSON with this structure:
        {{
            "education": [{{"institution": str, "degree": str, "field": str, "year": str}}],
            "experience": [{{"company": str, "title": str, "duration": str, "description": str}}],
            "skills": [str],
            "projects": [{{"name": str, "description": str}}],
            "tools": [str],
            "certifications": [str],
            "years_of_experience": int,
            "seniority_estimation": "entry|mid|senior|lead",
            "summary": str
        }}
        
        Resume text:
        {raw_text[:4000]}
        """
        
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        return result
        
    except Exception as e:
        print(f"Gemini parsing error: {e}")
        return extract_resume_structure(raw_text)
