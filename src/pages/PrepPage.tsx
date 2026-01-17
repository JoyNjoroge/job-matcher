import { useState, useEffect } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";
import { InterviewQuestion } from "@/components/InterviewQuestion";
import { LoadingState } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { getInterviewPrep, getApplications } from "@/api";
import type { InterviewPrepData, Application } from "@/types";
import { cn } from "@/lib/utils";

export default function PrepPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [prepData, setPrepData] = useState<InterviewPrepData | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isLoadingPrep, setIsLoadingPrep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchApps() {
      try {
        const data = await getApplications();
        setApplications(data);
        if (data.length > 0) {
          setSelectedApp(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load applications");
      } finally {
        setIsLoadingApps(false);
      }
    }
    fetchApps();
  }, []);

  useEffect(() => {
    if (!selectedApp) return;

    async function fetchPrep() {
      setIsLoadingPrep(true);
      setError(null);
      try {
        const data = await getInterviewPrep(selectedApp!.id);
        setPrepData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load prep data");
      } finally {
        setIsLoadingPrep(false);
      }
    }
    fetchPrep();
  }, [selectedApp]);

  if (isLoadingApps) {
    return <LoadingState message="Loading applications..." />;
  }

  if (applications.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
          <MessageSquare className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Applications Yet
        </h2>
        <p className="text-muted-foreground">
          Analyze a job first to prepare for interviews
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Interview Prep</h1>
            <p className="text-sm text-muted-foreground">
              Practice questions and talking points
            </p>
          </div>
        </div>

        {/* Application Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <span className="max-w-[200px] truncate">
              {selectedApp?.job_title} at {selectedApp?.company}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-card shadow-lg z-10">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg",
                    app.id === selectedApp?.id && "bg-muted"
                  )}
                >
                  <p className="font-medium text-foreground truncate">{app.job_title}</p>
                  <p className="text-muted-foreground truncate">{app.company}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoadingPrep ? (
        <LoadingState message="Generating interview prep..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => selectedApp && setSelectedApp({ ...selectedApp })} />
      ) : prepData ? (
        <div className="space-y-4">
          {prepData.questions.map((q, index) => (
            <InterviewQuestion
              key={index}
              index={index}
              question={q.question}
              whatTheyTest={q.what_they_test}
              talkingPoints={q.talking_points}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
