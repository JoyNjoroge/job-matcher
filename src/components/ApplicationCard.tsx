import { Building2 } from "lucide-react";
import type { Application } from "@/types";
import { FitScoreRing } from "./FitScoreRing";
import { LikelihoodBadge } from "./LikelihoodBadge";

interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate">
            {application.job_title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{application.company}</span>
          </div>
          <div className="mt-3">
            <LikelihoodBadge likelihood={application.interview_likelihood} />
          </div>
        </div>
        <FitScoreRing score={application.fit_score} size="sm" />
      </div>
    </button>
  );
}
