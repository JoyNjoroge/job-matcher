"""
Scraper Service - Handles job listing scraping and search.
"""

import uuid
import requests
from bs4 import BeautifulSoup
from typing import List, Optional


def scrape_job_description(url: str) -> str:
    """
    Scrape job description from a URL.
    
    Args:
        url: Job posting URL
    
    Returns:
        Extracted job description text
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()
        
        # Try to find job description container (common patterns)
        description_selectors = [
            ".job-description",
            ".description",
            "#job-description",
            "[data-testid='jobDescriptionText']",
            ".jobsearch-jobDescriptionText",
            "article",
            ".posting-requirements",
            ".job-details"
        ]
        
        for selector in description_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(separator="\n", strip=True)
        
        # Fallback: get main content
        main = soup.find("main") or soup.find("body")
        if main:
            return main.get_text(separator="\n", strip=True)[:5000]
        
        return ""
    
    except Exception as e:
        print(f"Scraping error for {url}: {e}")
        return ""


def search_jobs(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> List[dict]:
    """
    Search for job listings.
    
    Note: This is a placeholder implementation. In production, you would
    integrate with job APIs like Indeed, LinkedIn, or custom scrapers.
    
    Args:
        query: Search keywords
        location: Location filter
        job_types: List of job types (remote/onsite/hybrid)
        experience_levels: List of experience levels
    
    Returns:
        List of job dictionaries
    """
    # Placeholder implementation - returns mock data
    # In production, integrate with job APIs or scraping services
    
    mock_jobs = [
        {
            "id": str(uuid.uuid4()),
            "title": f"Senior {query} Developer",
            "company": "TechCorp Inc.",
            "location": location or "Remote",
            "description": f"We are looking for an experienced {query} developer to join our team. You will be responsible for designing, developing, and maintaining high-quality software solutions.",
            "apply_link": "https://example.com/apply/1"
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"{query} Engineer",
            "company": "StartupXYZ",
            "location": location or "San Francisco, CA",
            "description": f"Join our fast-growing startup as a {query} Engineer. You'll work on cutting-edge projects and have direct impact on our product.",
            "apply_link": "https://example.com/apply/2"
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"Lead {query} Architect",
            "company": "Enterprise Solutions Ltd.",
            "location": location or "New York, NY",
            "description": f"We're seeking a Lead {query} Architect to drive technical strategy and mentor junior developers. 5+ years experience required.",
            "apply_link": "https://example.com/apply/3"
        }
    ]
    
    # Filter by job type if specified
    if job_types:
        # In production, filter based on actual job data
        pass
    
    # Filter by experience level if specified
    if experience_levels:
        # In production, filter based on actual job data
        pass
    
    return mock_jobs
