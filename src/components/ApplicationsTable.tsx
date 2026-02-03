import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ExternalLink, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApplications, TrackedApplication } from "@/contexts/ApplicationContext";
import { FitScoreRing } from "@/components/FitScoreRing";
import { format } from "date-fns";

export function ApplicationsTable() {
  const navigate = useNavigate();
  const { applications, toggleSelectedForInterview, removeApplication } = useApplications();
  const [deleteApp, setDeleteApp] = useState<TrackedApplication | null>(null);

  const handleDelete = () => {
    if (deleteApp) {
      removeApplication(deleteApp.id);
      setDeleteApp(null);
    }
  };

  const handlePrepClick = (app: TrackedApplication) => {
    navigate("/prep", { state: { applicationId: app.id } });
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">No applications tracked yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Apply to jobs and confirm to start tracking.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Interview</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-center">Fit Score</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <Checkbox
                    checked={app.selectedForInterview}
                    onCheckedChange={() => toggleSelectedForInterview(app.id)}
                    aria-label="Select for interview"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{app.job.title}</p>
                    <p className="text-xs text-muted-foreground">{app.job.location}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{app.job.company}</TableCell>
                <TableCell className="text-center">
                  {app.analysis ? (
                    <div className="flex justify-center">
                      <FitScoreRing score={app.analysis.fit_score} size="sm" />
                    </div>
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(app.appliedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {app.selectedForInterview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrepClick(app)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Prep
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={app.job.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteApp(app)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteApp} onOpenChange={() => setDeleteApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteApp?.job.title}" at {deleteApp?.job.company} from
              your tracked applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
