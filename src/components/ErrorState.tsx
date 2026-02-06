import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function ErrorState({
  title = "Error",
  message = "Something went wrong",
  onRetry,
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      {action ? (
        action
      ) : onRetry ? (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
