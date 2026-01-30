"""
Scraper Service - Handles job listing scraping and search using real APIs.
Integrates with JSearch (RapidAPI), Adzuna, and SerpAPI for job listings.
"""

import os
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


def search_jobs_jsearch(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> List[dict]:
    """
    Search jobs using JSearch API (RapidAPI).
    """
    api_key = os.getenv("JSEARCH_API_KEY")
    if not api_key:
        return []
    
    try:
        url = "https://jsearch.p.rapidapi.com/search"
        
        # Build query string
        search_query = query
        if location:
            search_query = f"{query} in {location}"
        
        # Map job types
        remote_only = "remote" in (job_types or [])
        
        params = {
            "query": search_query,
            "page": "1",
            "num_pages": "1",
            "remote_jobs_only": str(remote_only).lower()
        }
        
        # Map experience levels to JSearch format
        if experience_levels:
            level_map = {
                "entry": "under_3_years_experience",
                "mid": "more_than_3_years_experience", 
                "senior": "more_than_3_years_experience",
                "lead": "more_than_3_years_experience"
            }
            if experience_levels[0] in level_map:
                params["employment_types"] = "FULLTIME"
        
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        jobs = []
        for job in data.get("data", [])[:10]:
            jobs.append({
                "id": job.get("job_id", str(uuid.uuid4())),
                "title": job.get("job_title", ""),
                "company": job.get("employer_name", ""),
                "location": job.get("job_city", "") or job.get("job_country", "Remote"),
                "description": job.get("job_description", "")[:2000],
                "apply_link": job.get("job_apply_link", "") or job.get("job_google_link", ""),
                "source": "jsearch"
            })
        
        return jobs
        
    except Exception as e:
        print(f"JSearch API error: {e}")
        return []


def search_jobs_adzuna(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> List[dict]:
    """
    Search jobs using Adzuna API.
    """
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        return []
    
    try:
        # Default to US, could be made configurable
        country = "us"
        
        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
        
        params = {
            "app_id": app_id,
            "app_key": app_key,
            "what": query,
            "results_per_page": 10,
            "content-type": "application/json"
        }
        
        if location:
            params["where"] = location
        
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        jobs = []
        for job in data.get("results", []):
            jobs.append({
                "id": str(job.get("id", uuid.uuid4())),
                "title": job.get("title", ""),
                "company": job.get("company", {}).get("display_name", "Unknown"),
                "location": job.get("location", {}).get("display_name", ""),
                "description": job.get("description", "")[:2000],
                "apply_link": job.get("redirect_url", ""),
                "source": "adzuna"
            })
        
        return jobs
        
    except Exception as e:
        print(f"Adzuna API error: {e}")
        return []


def search_jobs_serpapi(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> List[dict]:
    """
    Search jobs using SerpAPI (Google Jobs).
    """
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return []
    
    try:
        url = "https://serpapi.com/search"
        
        params = {
            "engine": "google_jobs",
            "q": query,
            "api_key": api_key,
            "hl": "en"
        }
        
        if location:
            params["location"] = location
        
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        jobs = []
        for job in data.get("jobs_results", [])[:10]:
            # Get full description from extensions if available
            description = job.get("description", "")
            
            jobs.append({
                "id": str(uuid.uuid4()),
                "title": job.get("title", ""),
                "company": job.get("company_name", ""),
                "location": job.get("location", ""),
                "description": description[:2000],
                "apply_link": job.get("apply_options", [{}])[0].get("link", "") if job.get("apply_options") else "",
                "source": "serpapi"
            })
        
        return jobs
        
    except Exception as e:
        print(f"SerpAPI error: {e}")
        return []


def search_jobs(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> List[dict]:
    """
    Search for job listings using multiple APIs.
    Tries JSearch first, falls back to Adzuna, then SerpAPI.
    
    Args:
        query: Search keywords
        location: Location filter
        job_types: List of job types (remote/onsite/hybrid)
        experience_levels: List of experience levels
    
    Returns:
        List of job dictionaries
    """
    all_jobs = []
    
    # Try JSearch API first
    jsearch_jobs = search_jobs_jsearch(query, location, job_types, experience_levels)
    all_jobs.extend(jsearch_jobs)
    
    # If not enough results, try Adzuna
    if len(all_jobs) < 5:
        adzuna_jobs = search_jobs_adzuna(query, location, job_types, experience_levels)
        all_jobs.extend(adzuna_jobs)
    
    # If still not enough, try SerpAPI
    if len(all_jobs) < 5:
        serpapi_jobs = search_jobs_serpapi(query, location, job_types, experience_levels)
        all_jobs.extend(serpapi_jobs)
    
    # Deduplicate by title + company
    seen = set()
    unique_jobs = []
    for job in all_jobs:
        key = f"{job['title'].lower()}_{job['company'].lower()}"
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)
    
    return unique_jobs[:15]  # Return max 15 jobs
