import { ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
  onCheckFit: (job: Job) => void;
}

export function JobCard({ job, onCheckFit }: JobCardProps) {
  const truncatedDescription = job.description.length > 150 
    ? job.description.substring(0, 150) + "..." 
    : job.description;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-foreground leading-tight">
            {job.title}
          </h3>
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
          className="flex-1"
          size="sm"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Check Fit
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a 
            href={job.apply_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
