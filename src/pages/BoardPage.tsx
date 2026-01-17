import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { KanbanColumn } from "@/components/KanbanColumn";
import { LoadingState } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { getApplications } from "@/api";
import type { Application, FitCategory } from "@/types";

function categorizeByFit(score: number): FitCategory {
  if (score >= 70) return "strong";
  if (score >= 40) return "medium";
  return "low";
}

export default function BoardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApplicationClick = (app: Application) => {
    navigate("/results", {
      state: {
        analysis: app.analysis || {
          fit_score: app.fit_score,
          interview_likelihood: app.interview_likelihood,
          strengths: [],
          gaps: [],
          red_flags: [],
        },
      },
    });
  };

  const strongFit = applications.filter((a) => categorizeByFit(a.fit_score) === "strong");
  const mediumFit = applications.filter((a) => categorizeByFit(a.fit_score) === "medium");
  const lowFit = applications.filter((a) => categorizeByFit(a.fit_score) === "low");

  if (isLoading) {
    return <LoadingState message="Loading applications..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchApplications} />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <LayoutGrid className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Application Board</h1>
          <p className="text-sm text-muted-foreground">
            {applications.length} applications tracked
          </p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        <KanbanColumn
          title="Strong Fit"
          category="strong"
          applications={strongFit}
          onApplicationClick={handleApplicationClick}
        />
        <KanbanColumn
          title="Medium Fit"
          category="medium"
          applications={mediumFit}
          onApplicationClick={handleApplicationClick}
        />
        <KanbanColumn
          title="Low Fit"
          category="low"
          applications={lowFit}
          onApplicationClick={handleApplicationClick}
        />
      </div>
    </div>
  );
}
