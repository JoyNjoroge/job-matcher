import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/JobCard";
import { JobSearchFilters } from "@/components/JobSearchFilters";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { searchJobs } from "@/api";
import type { Job, JobType, ExperienceLevel, APIStatus, JobSearchSummary } from "@/types";
import { cn } from "@/lib/utils";

function APIStatusIndicator({ status }: { status: APIStatus }) {
  const getStatusStyles = () => {
    switch (status.status) {
      case "success":
        return "text-primary";
      case "error":
        return "text-destructive";
      case "timeout":
        return "text-accent-foreground";
      case "rate_limited":
        return "text-accent-foreground";
      case "no_api_key":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = () => {
    const className = cn("h-3.5 w-3.5", getStatusStyles());
    switch (status.status) {
      case "success":
        return <CheckCircle2 className={className} />;
      case "error":
        return <XCircle className={className} />;
      case "timeout":
        return <Clock className={className} />;
      case "rate_limited":
        return <AlertCircle className={className} />;
      case "no_api_key":
        return <AlertCircle className={className} />;
      default:
        return <AlertCircle className={className} />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case "success":
        return `${status.jobs_count} jobs`;
      case "error":
        return "Error";
      case "timeout":
        return "Timeout";
      case "rate_limited":
        return "Rate limited";
      case "no_api_key":
        return "Not configured";
      default:
        return status.status;
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {getStatusIcon()}
      <span className="capitalize font-medium">{status.source}</span>
      <span className="text-muted-foreground">({getStatusText()})</span>
    </div>
  );
}

function SearchSummary({ 
  summary, 
  apiStatuses 
}: { 
  summary: JobSearchSummary; 
  apiStatuses: APIStatus[];
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Found {summary.jobs_found} job{summary.jobs_found !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summary.successful_sources}/{summary.total_sources} sources responded
            {summary.duplicates_removed ? ` • ${summary.duplicates_removed} duplicates removed` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {apiStatuses.map((status) => (
            <APIStatusIndicator key={status.source} status={status} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<JobType[]>([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([]);
  const [summary, setSummary] = useState<JobSearchSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await searchJobs({
        query: query.trim(),
        location: location.trim() || undefined,
        job_type: selectedJobTypes.length > 0 ? selectedJobTypes : undefined,
        experience_level: selectedExperienceLevels.length > 0 ? selectedExperienceLevels : undefined,
      });
      setJobs(result.jobs);
      setApiStatuses(result.api_status || []);
      setSummary(result.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search jobs");
      setJobs([]);
      setApiStatuses([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckFit = (job: Job) => {
    navigate("/analyze", { state: { selectedJob: job } });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <Briefcase className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Search Jobs</h1>
        <p className="text-muted-foreground mt-2">
          Find jobs and check your fit before applying
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Job title, keywords, or company"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <div className="md:w-64 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim() || isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="border-t border-border pt-6">
          <JobSearchFilters
            selectedJobTypes={selectedJobTypes}
            selectedExperienceLevels={selectedExperienceLevels}
            onJobTypeChange={setSelectedJobTypes}
            onExperienceLevelChange={setSelectedExperienceLevels}
          />
        </div>
      </div>

      {/* Results */}
      {error && <ErrorState message={error} onRetry={handleSearch} />}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Searching across multiple job sources...</p>
        </div>
      )}

      {!isLoading && !error && hasSearched && summary && apiStatuses.length > 0 && (
        <SearchSummary summary={summary} apiStatuses={apiStatuses} />
      )}

      {!isLoading && !error && hasSearched && jobs.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}

      {!isLoading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onCheckFit={handleCheckFit} />
          ))}
        </div>
      )}

      {!hasSearched && !isLoading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Start your search</h3>
          <p className="text-muted-foreground">
            Enter keywords to find your next opportunity
          </p>
        </div>
      )}
    </div>
  );
}
