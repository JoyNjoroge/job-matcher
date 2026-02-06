import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobSearchFilters } from "@/components/JobSearchFilters";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { searchJobs } from "@/api";
import { useApplications } from "@/contexts/ApplicationContext";
import type { JobSearchParams, JobType, ExperienceLevel } from "@/types";

export default function SearchPage() {
  const navigate = useNavigate();
  const { searchResults, setSearchResults, clearSearchResults } = useApplications();

  // Initialize from cached results if available
  const [query, setQuery] = useState(searchResults?.query || "");
  const [location, setLocation] = useState(searchResults?.filters?.location || "");
  const [jobType, setJobType] = useState<JobType[]>(searchResults?.filters?.job_type || []);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel[]>(searchResults?.filters?.experience_level || []);
  
  const [jobs, setJobs] = useState(searchResults?.jobs || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!searchResults);

  // Clear cache when component unmounts if user navigated away
  useEffect(() => {
    return () => {
      // Don't clear if we're navigating to apply briefing
      if (!window.location.pathname.includes('/apply-briefing')) {
        // Optional: keep results for 30 minutes
        // clearSearchResults();
      }
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params: JobSearchParams = {
        query: query.trim(),
        location: location.trim() || undefined,
        job_type: jobType.length > 0 ? jobType : undefined,
        experience_level: experienceLevel.length > 0 ? experienceLevel : undefined,
      };

      const results = await searchJobs(params);
      setJobs(results.jobs || []);

      // Persist search results
      setSearchResults({
        jobs: results.jobs || [],
        query: query.trim(),
        filters: {
          location: location.trim(),
          job_type: jobType,
          experience_level: experienceLevel,
        },
        timestamp: Date.now(),
      });

    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search jobs. Please try again.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setLocation("");
    setJobType([]);
    setExperienceLevel([]);
    setJobs([]);
    setHasSearched(false);
    setError(null);
    clearSearchResults();
  };

  const handleApply = (job: any) => {
    // Navigate to apply briefing page with job data
    navigate(`/apply-briefing?job_id=${job.id}`);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Search Jobs</h1>
        <p className="text-muted-foreground">
          Find your next opportunity from thousands of listings
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Job Search</CardTitle>
          <CardDescription>
            Search for jobs by title, company, or keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">What</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Job title, keywords, or company"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Where</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City, state, or remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <JobSearchFilters
              selectedJobTypes={jobType}
              selectedExperienceLevels={experienceLevel}
              onJobTypeChange={setJobType}
              onExperienceLevelChange={setExperienceLevel}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Jobs
                  </>
                )}
              </Button>
              {hasSearched && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Search Failed"
          message={error}
          action={
            <Button onClick={handleSearch}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Results */}
      {hasSearched && !loading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {jobs.length} {jobs.length === 1 ? "Job" : "Jobs"} Found
            </h2>
            <p className="text-sm text-muted-foreground">
              Searched: {query} {location && `in ${location}`}
            </p>
          </div>

          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job: any) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 text-base">
                          <span className="font-medium">{job.company}</span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApply(job)}
                          size="sm"
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {job.job_type && (
                        <Badge variant="secondary">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {job.job_type}
                        </Badge>
                      )}
                      {job.experience_level && (
                        <Badge variant="secondary">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {job.experience_level}
                        </Badge>
                      )}
                      {job.salary && (
                        <Badge variant="outline">{job.salary}</Badge>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    {job.posted_date && (
                      <p className="text-xs text-muted-foreground">
                        Posted {job.posted_date}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Your Job Search</h3>
            <p className="text-muted-foreground">
              Enter a job title or keyword to find opportunities
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}