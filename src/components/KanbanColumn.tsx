import type { Application, FitCategory } from "@/types";
import { ApplicationCard } from "./ApplicationCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  title: string;
  category: FitCategory;
  applications: Application[];
  onApplicationClick: (app: Application) => void;
}

export function KanbanColumn({
  title,
  category,
  applications,
  onApplicationClick,
}: KanbanColumnProps) {
  const headerColors = {
    strong: "bg-fit-strong/10 text-fit-strong border-fit-strong/30",
    medium: "bg-fit-medium/10 text-fit-medium border-fit-medium/30",
    low: "bg-fit-low/10 text-fit-low border-fit-low/30",
  };

  return (
    <div className="flex flex-col min-w-[320px] w-[320px]">
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-4 py-2 mb-4",
          headerColors[category]
        )}
      >
        <span className="font-medium">{title}</span>
        <span className="text-sm opacity-70">{applications.length}</span>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onClick={() => onApplicationClick(app)}
          />
        ))}
        
        {applications.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No applications yet
          </div>
        )}
      </div>
    </div>
  );
}
