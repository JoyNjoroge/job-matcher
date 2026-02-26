"""
Jobs route - Job search endpoints with tier-based result limits.
"""

from flask import Blueprint, request, jsonify, g
from services.scraper import search_jobs
from services.auth import require_auth
from services.subscription import get_job_results_limit, get_plan_id

jobs_bp = Blueprint("jobs", __name__)


@jobs_bp.route("/jobs/search", methods=["GET"])
@require_auth
def search():
    """
    Search for job listings.

    Query params:
        - query: str (required)
        - location: str (optional)
        - job_type: list[str] (optional) - remote/onsite/hybrid
        - experience_level: list[str] (optional) - entry/mid/senior/lead

    Returns:
        - jobs: list of Job objects (sliced by plan)
        - total_found: int (total before slicing)
        - results_limit: int (how many this plan can see)
        - plan: str (user's current plan)
        - api_status, summary
    """
    try:
        query = request.args.get("query", "")
        if not query:
            return jsonify({"error": "Search query is required"}), 400

        location          = request.args.get("location", "")
        job_types         = request.args.getlist("job_type")
        experience_levels = request.args.getlist("experience_level")

        result = search_jobs(
            query=query,
            location=location,
            job_types=job_types,
            experience_levels=experience_levels,
        )

        # Slice results based on plan
        all_jobs      = result.get("jobs", [])
        total_found   = len(all_jobs)
        results_limit = get_job_results_limit(g.user_id)
        plan_id       = get_plan_id(g.user_id)
        sliced_jobs   = all_jobs[:results_limit]

        return jsonify({
            **result,
            "jobs":          sliced_jobs,
            "total_found":   total_found,
            "results_limit": results_limit,
            "showing":       len(sliced_jobs),
            "plan":          plan_id,
            "has_more":      total_found > results_limit,
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "jobs": [], "api_status": [],
            "summary": {"successful_sources": 0, "total_sources": 3, "jobs_found": 0},
        }), 500
