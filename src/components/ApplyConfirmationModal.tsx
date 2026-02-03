import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";
import type { Job } from "@/types";

interface ApplyConfirmationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ApplyConfirmationModal({
  job,
  isOpen,
  onClose,
  onConfirm,
}: ApplyConfirmationModalProps) {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Application Confirmation
          </DialogTitle>
          <DialogDescription>
            Did you complete the application for this position?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/50 p-4 my-4">
          <h4 className="font-medium text-foreground">{job.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
          <p className="text-xs text-muted-foreground">{job.location}</p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-2" />
            Not Yet
          </Button>
          <Button onClick={onConfirm} className="flex-1 sm:flex-none">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Yes, Applied!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
