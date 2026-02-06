import { MapPin, Building2, DollarSign, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/types";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  job: Job;
  onCheckFit?: (job: Job) => void;
}

export function JobCard({ job, onCheckFit }: JobCardProps) {
  const navigate = useNavigate();

  const handleApply = () => {
    // Navigate to briefing page instead of direct redirect
    navigate(`/apply-briefing?job_id=${job.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 text-foreground">
            {job.title}
          </h3>
          {job.source && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {job.source}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{job.company}</span>
        </div>
        
        {job.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {job.job_type && (
            <Badge variant="secondary" className="text-xs">
              {job.job_type}
            </Badge>
          )}
          {job.experience_level && (
            <Badge variant="secondary" className="text-xs">
              {job.experience_level}
            </Badge>
          )}
        </div>

        {job.salary_range && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>{job.salary_range}</span>
          </div>
        )}

        {job.posted_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{job.posted_date}</span>
          </div>
        )}

        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.description}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleApply} 
            className="flex-1"
            size="sm"
          >
            Apply
          </Button>
          
          {onCheckFit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCheckFit(job)}
              className="gap-1"
            >
              Check Fit
            </Button>
          )}
          
          {job.application_url && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="shrink-0"
            >
              <a 
                href={job.application_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
