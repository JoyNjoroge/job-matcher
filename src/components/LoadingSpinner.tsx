import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
