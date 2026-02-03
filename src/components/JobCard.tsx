import { useState } from "react";
import { ExternalLink, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplyConfirmationModal } from "@/components/ApplyConfirmationModal";
import { useApplications } from "@/contexts/ApplicationContext";
import type { Job, AnalysisResult } from "@/types";

interface JobCardProps {
  job: Job;
  onCheckFit: (job: Job) => void;
  analysis?: AnalysisResult;
  cvText?: string;
}

export function JobCard({ job, onCheckFit, analysis, cvText }: JobCardProps) {
  const { addApplication, applications } = useApplications();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const isAlreadyApplied = applications.some(
    (app) => app.job.id === job.id || (app.job.title === job.title && app.job.company === job.company)
  );

  const truncatedDescription = job.description.length > 150 
    ? job.description.substring(0, 150) + "..." 
    : job.description;

  const handleApplyClick = () => {
    // Open external link
    window.open(job.apply_link, "_blank", "noopener,noreferrer");
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmApplication = () => {
    addApplication(job, analysis, cvText);
    setShowConfirmModal(false);
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg text-foreground leading-tight">
                {job.title}
              </h3>
              {isAlreadyApplied && (
                <Badge variant="secondary" className="flex-shrink-0">
                  Applied
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{job.company}</p>
            <p className="text-xs text-muted-foreground">{job.location}</p>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {truncatedDescription}
          </p>
        </CardContent>
        
        <CardFooter className="flex gap-2 pt-0">
          <Button
            onClick={() => onCheckFit(job)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Fit
          </Button>
          <Button
            onClick={handleApplyClick}
            size="sm"
            disabled={isAlreadyApplied}
          >
            <Send className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </CardFooter>
      </Card>

      <ApplyConfirmationModal
        job={job}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmApplication}
      />
    </>
  );
}
