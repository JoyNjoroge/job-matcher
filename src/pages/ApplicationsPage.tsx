import { ClipboardList } from "lucide-react";
import { ApplicationsTable } from "@/components/ApplicationsTable";
import { useApplications } from "@/contexts/ApplicationContext";

export default function ApplicationsPage() {
  const { applications, interviewReadyApplications } = useApplications();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
          <p className="text-sm text-muted-foreground">
            {applications.length} application{applications.length !== 1 ? "s" : ""} tracked
            {interviewReadyApplications.length > 0 && (
              <> · {interviewReadyApplications.length} selected for interview</>
            )}
          </p>
        </div>
      </div>

      <ApplicationsTable />
    </div>
  );
}
