"""
Parser Service - Handles CV/resume file parsing.
"""

import io
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
