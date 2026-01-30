"""
Jobs route - Job search endpoints.
"""

from flask import Blueprint, request, jsonify
from services.scraper import search_jobs

jobs_bp = Blueprint("jobs", __name__)


@jobs_bp.route("/jobs/search", methods=["GET"])
def search():
    """
    Search for job listings.
    
    Query params:
        - query: str (required) - Search keywords
        - location: str (optional) - Location filter
        - job_type: list[str] (optional) - remote/onsite/hybrid
        - experience_level: list[str] (optional) - entry/mid/senior/lead
    
    Returns:
        - jobs: list of Job objects
        - api_status: list of API statuses for each source
        - summary: aggregated search summary
    """
    try:
        query = request.args.get("query", "")
        
        if not query:
            return jsonify({"error": "Search query is required"}), 400
        
        location = request.args.get("location", "")
        job_types = request.args.getlist("job_type")
        experience_levels = request.args.getlist("experience_level")
        
        result = search_jobs(
            query=query,
            location=location,
            job_types=job_types,
            experience_levels=experience_levels
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "jobs": [],
            "api_status": [],
            "summary": {
                "successful_sources": 0,
                "total_sources": 3,
                "jobs_found": 0
            }
        }), 500
