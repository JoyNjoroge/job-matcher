import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, ChevronDown, AlertCircle } from "lucide-react";
import { useApplications } from "@/contexts/ApplicationContext";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import { cn } from "@/lib/utils";
import type { TrackedApplication } from "@/types";

interface LocationState {
  applicationId?: string;
}

export default function PrepPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { interviewReadyApplications, getApplicationById } = useApplications();
  
  const [selectedApp, setSelectedApp] = useState<TrackedApplication | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Handle navigation from applications table
  useEffect(() => {
    if (state?.applicationId) {
      const app = getApplicationById(state.applicationId);
      if (app) {
        setSelectedApp(app);
      }
      // Clear the location state
      window.history.replaceState({}, document.title);
    } else if (interviewReadyApplications.length > 0 && !selectedApp) {
      setSelectedApp(interviewReadyApplications[0]);
    }
  }, [state?.applicationId, interviewReadyApplications, getApplicationById, selectedApp]);

  if (interviewReadyApplications.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
          <MessageSquare className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Applications Selected for Interview
        </h2>
        <p className="text-muted-foreground mb-4">
          Go to your Applications page and check "Selected for Interview" on applications you want to prepare for.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
          <AlertCircle className="h-4 w-4" />
          <span>Tip: Click the checkbox in the "Interview" column to select applications</span>
        </div>
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
              AI-generated questions based on job & CV
            </p>
          </div>
        </div>

        {/* Application Selector */}
        {interviewReadyApplications.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span className="max-w-[200px] truncate">
                {selectedApp?.job.title} at {selectedApp?.job.company}
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
                {interviewReadyApplications.map((app) => (
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
                    <p className="font-medium text-foreground truncate">{app.job.title}</p>
                    <p className="text-muted-foreground truncate">{app.job.company}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedApp && <InterviewPrepPanel application={selectedApp} />}
    </div>
  );
}
