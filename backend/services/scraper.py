"""
Scraper Service - Handles job listing scraping and search using real APIs.
Integrates with JSearch (RapidAPI), Adzuna, and SerpAPI for job listings.
Includes comprehensive error handling and logging.
"""

import os
import uuid
import requests
import logging
from bs4 import BeautifulSoup
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class APIStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"
    NO_KEY = "no_api_key"
    TIMEOUT = "timeout"
    RATE_LIMITED = "rate_limited"


@dataclass
class APIResult:
    """Result from an individual API call."""
    source: str
    status: APIStatus
    jobs: List[dict]
    error_message: Optional[str] = None
    jobs_count: int = 0
    
    def to_dict(self) -> dict:
        return {
            "source": self.source,
            "status": self.status.value,
            "jobs_count": self.jobs_count,
            "error_message": self.error_message
        }


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
    
    except requests.Timeout:
        logger.warning(f"Timeout scraping {url}")
        return ""
    except requests.RequestException as e:
        logger.warning(f"Request error scraping {url}: {e}")
        return ""
    except Exception as e:
        logger.error(f"Unexpected error scraping {url}: {e}")
        return ""


def search_jobs_jsearch(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> APIResult:
    """
    Search jobs using JSearch API (RapidAPI).
    Returns APIResult with status and jobs.
    """
    api_key = os.getenv("JSEARCH_API_KEY")
    
    if not api_key:
        logger.info("JSearch API key not configured")
        return APIResult(
            source="jsearch",
            status=APIStatus.NO_KEY,
            jobs=[],
            error_message="API key not configured"
        )
    
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
        
        logger.info(f"JSearch API request: query='{search_query}'")
        response = requests.get(url, headers=headers, params=params, timeout=15)
        
        # Handle rate limiting
        if response.status_code == 429:
            logger.warning("JSearch API rate limited")
            return APIResult(
                source="jsearch",
                status=APIStatus.RATE_LIMITED,
                jobs=[],
                error_message="Rate limit exceeded"
            )
        
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
        
        logger.info(f"JSearch API returned {len(jobs)} jobs")
        return APIResult(
            source="jsearch",
            status=APIStatus.SUCCESS,
            jobs=jobs,
            jobs_count=len(jobs)
        )
        
    except requests.Timeout:
        logger.error("JSearch API timeout")
        return APIResult(
            source="jsearch",
            status=APIStatus.TIMEOUT,
            jobs=[],
            error_message="Request timed out"
        )
    except requests.RequestException as e:
        logger.error(f"JSearch API request error: {e}")
        return APIResult(
            source="jsearch",
            status=APIStatus.ERROR,
            jobs=[],
            error_message=str(e)
        )
    except Exception as e:
        logger.error(f"JSearch API unexpected error: {e}")
        return APIResult(
            source="jsearch",
            status=APIStatus.ERROR,
            jobs=[],
            error_message=f"Unexpected error: {str(e)}"
        )


def search_jobs_adzuna(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> APIResult:
    """
    Search jobs using Adzuna API.
    Returns APIResult with status and jobs.
    """
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        logger.info("Adzuna API credentials not configured")
        return APIResult(
            source="adzuna",
            status=APIStatus.NO_KEY,
            jobs=[],
            error_message="API credentials not configured"
        )
    
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
        
        logger.info(f"Adzuna API request: query='{query}', location='{location}'")
        response = requests.get(url, params=params, timeout=15)
        
        # Handle rate limiting
        if response.status_code == 429:
            logger.warning("Adzuna API rate limited")
            return APIResult(
                source="adzuna",
                status=APIStatus.RATE_LIMITED,
                jobs=[],
                error_message="Rate limit exceeded"
            )
        
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
        
        logger.info(f"Adzuna API returned {len(jobs)} jobs")
        return APIResult(
            source="adzuna",
            status=APIStatus.SUCCESS,
            jobs=jobs,
            jobs_count=len(jobs)
        )
        
    except requests.Timeout:
        logger.error("Adzuna API timeout")
        return APIResult(
            source="adzuna",
            status=APIStatus.TIMEOUT,
            jobs=[],
            error_message="Request timed out"
        )
    except requests.RequestException as e:
        logger.error(f"Adzuna API request error: {e}")
        return APIResult(
            source="adzuna",
            status=APIStatus.ERROR,
            jobs=[],
            error_message=str(e)
        )
    except Exception as e:
        logger.error(f"Adzuna API unexpected error: {e}")
        return APIResult(
            source="adzuna",
            status=APIStatus.ERROR,
            jobs=[],
            error_message=f"Unexpected error: {str(e)}"
        )


def search_jobs_serpapi(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> APIResult:
    """
    Search jobs using SerpAPI (Google Jobs).
    Returns APIResult with status and jobs.
    """
    api_key = os.getenv("SERPAPI_KEY")
    
    if not api_key:
        logger.info("SerpAPI key not configured")
        return APIResult(
            source="serpapi",
            status=APIStatus.NO_KEY,
            jobs=[],
            error_message="API key not configured"
        )
    
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
        
        logger.info(f"SerpAPI request: query='{query}', location='{location}'")
        response = requests.get(url, params=params, timeout=15)
        
        # Handle rate limiting
        if response.status_code == 429:
            logger.warning("SerpAPI rate limited")
            return APIResult(
                source="serpapi",
                status=APIStatus.RATE_LIMITED,
                jobs=[],
                error_message="Rate limit exceeded"
            )
        
        response.raise_for_status()
        data = response.json()
        
        # Check for API errors in response
        if "error" in data:
            logger.error(f"SerpAPI error response: {data['error']}")
            return APIResult(
                source="serpapi",
                status=APIStatus.ERROR,
                jobs=[],
                error_message=data["error"]
            )
        
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
        
        logger.info(f"SerpAPI returned {len(jobs)} jobs")
        return APIResult(
            source="serpapi",
            status=APIStatus.SUCCESS,
            jobs=jobs,
            jobs_count=len(jobs)
        )
        
    except requests.Timeout:
        logger.error("SerpAPI timeout")
        return APIResult(
            source="serpapi",
            status=APIStatus.TIMEOUT,
            jobs=[],
            error_message="Request timed out"
        )
    except requests.RequestException as e:
        logger.error(f"SerpAPI request error: {e}")
        return APIResult(
            source="serpapi",
            status=APIStatus.ERROR,
            jobs=[],
            error_message=str(e)
        )
    except Exception as e:
        logger.error(f"SerpAPI unexpected error: {e}")
        return APIResult(
            source="serpapi",
            status=APIStatus.ERROR,
            jobs=[],
            error_message=f"Unexpected error: {str(e)}"
        )


def search_jobs(
    query: str,
    location: str = "",
    job_types: Optional[List[str]] = None,
    experience_levels: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Search for job listings using multiple APIs.
    Returns jobs along with API status information for each source.
    
    Args:
        query: Search keywords
        location: Location filter
        job_types: List of job types (remote/onsite/hybrid)
        experience_levels: List of experience levels
    
    Returns:
        Dictionary with jobs list and api_status for each source
    """
    logger.info(f"Starting job search: query='{query}', location='{location}'")
    
    all_jobs = []
    api_statuses = []
    
    # Try all APIs and collect results
    jsearch_result = search_jobs_jsearch(query, location, job_types, experience_levels)
    api_statuses.append(jsearch_result.to_dict())
    all_jobs.extend(jsearch_result.jobs)
    
    adzuna_result = search_jobs_adzuna(query, location, job_types, experience_levels)
    api_statuses.append(adzuna_result.to_dict())
    all_jobs.extend(adzuna_result.jobs)
    
    serpapi_result = search_jobs_serpapi(query, location, job_types, experience_levels)
    api_statuses.append(serpapi_result.to_dict())
    all_jobs.extend(serpapi_result.jobs)
    
    # Deduplicate by title + company
    seen = set()
    unique_jobs = []
    for job in all_jobs:
        key = f"{job['title'].lower()}_{job['company'].lower()}"
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)
    
    # Calculate summary
    successful_apis = sum(1 for s in api_statuses if s["status"] == "success")
    total_before_dedup = len(all_jobs)
    total_after_dedup = len(unique_jobs[:15])
    
    logger.info(
        f"Job search complete: {successful_apis}/3 APIs succeeded, "
        f"{total_before_dedup} jobs found, {total_after_dedup} unique jobs returned"
    )
    
    return {
        "jobs": unique_jobs[:15],
        "api_status": api_statuses,
        "summary": {
            "successful_sources": successful_apis,
            "total_sources": 3,
            "jobs_found": total_after_dedup,
            "duplicates_removed": total_before_dedup - total_after_dedup
        }
    }
