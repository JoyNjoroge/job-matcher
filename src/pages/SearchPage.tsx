import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/JobCard";
import { JobSearchFilters } from "@/components/JobSearchFilters";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { searchJobs } from "@/api";
import type { Job, JobType, ExperienceLevel } from "@/types";

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<JobType[]>([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search jobs");
      setJobs([]);
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
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
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
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Found {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onCheckFit={handleCheckFit} />
            ))}
          </div>
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
