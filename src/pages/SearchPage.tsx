import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase, TrendingUp, ExternalLink, X, SlidersHorizontal, AlertCircle } from "lucide-react";
import { JobSearchFilters } from "@/components/JobSearchFilters";
import { searchJobs } from "@/api";
import { useApplications } from "@/contexts/ApplicationContext";
import type { JobSearchParams, JobType, ExperienceLevel } from "@/types";

export default function SearchPage() {
  const navigate = useNavigate();
  const { searchResults, setSearchResults, clearSearchResults } = useApplications();

  const [query, setQuery] = useState(searchResults?.query || "");
  const [location, setLocation] = useState(searchResults?.filters?.location || "");
  const [jobType, setJobType] = useState<JobType[]>((searchResults?.filters?.job_type as JobType[]) || []);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel[]>((searchResults?.filters?.experience_level as ExperienceLevel[]) || []);
  const [jobs, setJobs] = useState(searchResults?.jobs || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!searchResults);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) { setError("Please enter a search query"); return; }
    setLoading(true); setError(null); setHasSearched(true);
    try {
      const params: JobSearchParams = {
        query: query.trim(),
        location: location.trim() || undefined,
        job_type: jobType.length > 0 ? jobType : undefined,
        experience_level: experienceLevel.length > 0 ? experienceLevel : undefined,
      };
      const results = await searchJobs(params);
      setJobs(results.jobs || []);
      setSearchResults({ jobs: results.jobs || [], query: query.trim(), filters: { location: location.trim(), job_type: jobType, experience_level: experienceLevel }, timestamp: Date.now() });
    } catch (err: any) {
      setError(err.message || "Failed to search jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery(""); setLocation(""); setJobType([]); setExperienceLevel([]);
    setJobs([]); setHasSearched(false); setError(null); clearSearchResults();
  };

  return (
    <div className="search-root">
      <style>{`
        .search-root { font-family: var(--font-ui); max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }

        /* Header */
        .sr-header { margin-bottom: 36px; }
        .sr-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .sr-title { font-family: var(--font-ui); font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: -0.025em; color: #0A0A0F; margin: 0 0 8px; }
        .sr-sub { color: #6B7280; font-size: 15px; font-weight: 300; margin: 0; }

        /* Search bar */
        .sr-form { background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .sr-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        @media (max-width: 600px) { .sr-inputs { grid-template-columns: 1fr; } }
        .sr-field { position: relative; }
        .sr-field-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #9CA3AF; pointer-events: none; }
        .sr-input {
          width: 100%; height: 46px; padding: 0 14px 0 40px;
          border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px;
          font-family: var(--font-ui); font-size: 14px; color: #0A0A0F;
          background: #F9FAFB; outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .sr-input:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .sr-form-actions { display: flex; gap: 10px; }
        .sr-search-btn {
          flex: 1; height: 46px; background: #2563EB; color: white; border: none;
          border-radius: 10px; font-family: var(--font-ui); font-size: 14px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }
        .sr-search-btn:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
        .sr-search-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .sr-filter-btn {
          height: 46px; width: 46px; border: 1.5px solid rgba(0,0,0,0.1);
          background: white; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; color: #6B7280; flex-shrink: 0;
        }
        .sr-filter-btn:hover { border-color: #2563EB; color: #2563EB; }
        .sr-filter-btn.active { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.3); color: #2563EB; }
        .sr-clear-btn {
          height: 46px; padding: 0 16px; border: 1.5px solid rgba(0,0,0,0.1);
          background: white; border-radius: 10px; cursor: pointer;
          font-family: var(--font-ui); font-size: 13px; font-weight: 600;
          color: #6B7280; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
          flex-shrink: 0;
        }
        .sr-clear-btn:hover { color: #EF4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }

        /* Filter panel */
        .sr-filters-panel { margin-bottom: 20px; animation: fadeDown 0.2s ease; }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

        /* Error */
        .sr-error { display: flex; gap: 10px; align-items: flex-start; background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 14px 16px; font-size: 13px; color: #DC2626; margin-bottom: 20px; }

        /* Results header */
        .sr-results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
        .sr-results-count { font-family: var(--font-ui); font-weight: 700; font-size: 1.1rem; color: #0A0A0F; }
        .sr-results-meta { font-size: 13px; color: #9CA3AF; }

        /* Job card */
        .sr-job-card {
          background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px;
          padding: 24px 28px; margin-bottom: 14px; transition: all 0.2s;
          position: relative; overflow: hidden;
        }
        .sr-job-card::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
          background: linear-gradient(180deg, #2563EB, #7C3AED); opacity: 0; transition: opacity 0.2s;
        }
        .sr-job-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); border-color: rgba(37,99,235,0.2); transform: translateX(2px); }
        .sr-job-card:hover::before { opacity: 1; }
        .sr-job-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
        .sr-job-title { font-family: var(--font-ui); font-weight: 700; font-size: 1.05rem; color: #0A0A0F; margin: 0 0 4px; }
        .sr-job-meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #6B7280; flex-wrap: wrap; }
        .sr-job-meta-item { display: flex; align-items: center; gap: 4px; }
        .sr-job-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .sr-apply-btn {
          height: 38px; padding: 0 18px; background: #2563EB; color: white;
          border: none; border-radius: 9px; font-family: var(--font-ui);
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 3px 10px rgba(37,99,235,0.25);
        }
        .sr-apply-btn:hover { background: #1D4ED8; transform: translateY(-1px); }
        .sr-ext-btn {
          height: 38px; width: 38px; border: 1.5px solid rgba(0,0,0,0.1);
          background: white; border-radius: 9px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #6B7280; transition: all 0.2s;
          text-decoration: none;
        }
        .sr-ext-btn:hover { border-color: rgba(37,99,235,0.3); color: #2563EB; }
        .sr-job-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .sr-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 11px; border-radius: 999px;
          font-size: 12px; font-weight: 600;
        }
        .sr-tag-blue { background: rgba(37,99,235,0.08); color: #2563EB; }
        .sr-tag-purple { background: rgba(124,58,237,0.08); color: #7C3AED; }
        .sr-tag-green { background: rgba(16,185,129,0.08); color: #059669; }
        .sr-job-desc { font-size: 13px; color: #6B7280; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sr-job-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
        .sr-job-date { font-size: 12px; color: #9CA3AF; }
        .sr-salary { font-size: 13px; font-weight: 600; color: #059669; background: rgba(16,185,129,0.08); padding: 3px 10px; border-radius: 999px; }

        /* Empty / Initial */
        .sr-empty { text-align: center; padding: 80px 24px; }
        .sr-empty-icon { width: 72px; height: 72px; background: rgba(37,99,235,0.06); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #93C5FD; }
        .sr-empty h3 { font-family: var(--font-ui); font-weight: 700; font-size: 1.2rem; color: #0A0A0F; margin: 0 0 8px; }
        .sr-empty p { color: #6B7280; font-size: 14px; margin: 0; }

        /* Spinner */
        .sr-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Loading skeleton */
        .sr-skeleton { background: rgba(0,0,0,0.06); border-radius: 18px; margin-bottom: 14px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div className="sr-header">
        <div className="sr-eyebrow">
          <Search size={12} /> Job Search
        </div>
        <h1 className="sr-title">Find Your Next Role</h1>
        <p className="sr-sub">Search thousands of listings with AI-powered fit matching</p>
      </div>

      <form className="sr-form" onSubmit={handleSearch}>
        <div className="sr-inputs">
          <div className="sr-field">
            <Search size={16} className="sr-field-icon" />
            <input
              className="sr-input"
              placeholder="Job title, keywords, or company"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="sr-field">
            <MapPin size={16} className="sr-field-icon" />
            <input
              className="sr-input"
              placeholder="City, state, or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        <div className="sr-form-actions">
          <button type="submit" className="sr-search-btn" disabled={loading}>
            {loading ? <><div className="sr-spinner" /> Searching...</> : <><Search size={16} /> Search Jobs</>}
          </button>
          <button
            type="button"
            className={`sr-filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filters"
          >
            <SlidersHorizontal size={18} />
          </button>
          {hasSearched && (
            <button type="button" className="sr-clear-btn" onClick={handleClear}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </form>

      {showFilters && (
        <div className="sr-filters-panel">
          <JobSearchFilters
            selectedJobTypes={jobType}
            selectedExperienceLevels={experienceLevel}
            onJobTypeChange={setJobType}
            onExperienceLevelChange={setExperienceLevel}
          />
        </div>
      )}

      {error && (
        <div className="sr-error">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {hasSearched && !loading && !error && (
        <>
          <div className="sr-results-header">
            <div className="sr-results-count">
              {jobs.length} {jobs.length === 1 ? "Result" : "Results"}
            </div>
            <div className="sr-results-meta">
              "{query}"{location && ` · ${location}`}
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="sr-empty">
              <div className="sr-empty-icon"><Search size={28} /></div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or removing filters</p>
            </div>
          ) : (
            jobs.map((job: any) => (
              <div key={job.id} className="sr-job-card">
                <div className="sr-job-top">
                  <div>
                    <h3 className="sr-job-title">{job.title}</h3>
                    <div className="sr-job-meta">
                      <span className="sr-job-meta-item" style={{ fontWeight: 600, color: "#374151" }}>{job.company}</span>
                      {job.location && <span className="sr-job-meta-item"><MapPin size={12} />{job.location}</span>}
                    </div>
                  </div>
                  <div className="sr-job-actions">
                    <button className="sr-apply-btn" onClick={() => navigate(`/apply-briefing?job_id=${job.id}`)}>
                      Analyze & Apply
                    </button>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="sr-ext-btn">
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>

                <div className="sr-job-tags">
                  {job.job_type && (
                    <span className="sr-tag sr-tag-blue"><Briefcase size={11} />{job.job_type}</span>
                  )}
                  {job.experience_level && (
                    <span className="sr-tag sr-tag-purple"><TrendingUp size={11} />{job.experience_level}</span>
                  )}
                </div>

                {job.description && <p className="sr-job-desc">{job.description}</p>}

                <div className="sr-job-footer">
                  {job.posted_date && <span className="sr-job-date">Posted {job.posted_date}</span>}
                  {job.salary && <span className="sr-salary">{job.salary}</span>}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!hasSearched && !loading && (
        <div className="sr-empty">
          <div className="sr-empty-icon"><Search size={28} /></div>
          <h3>Start Your Search</h3>
          <p>Enter a job title or keyword above to find matching opportunities</p>
        </div>
      )}
    </div>
  );
}
