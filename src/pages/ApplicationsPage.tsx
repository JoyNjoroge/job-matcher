// ApplicationsPage.tsx
import { ClipboardList } from "lucide-react";
import { ApplicationsTable } from "@/components/ApplicationsTable";
import { useApplications } from "@/contexts/ApplicationContext";

export default function ApplicationsPage() {
  const { applications, interviewReadyApplications } = useApplications();

  return (
    <div className="apps-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .apps-root { font-family: 'DM Sans', sans-serif; max-width: 1200px; margin: 0 auto; padding: 48px 24px 80px; }
        .apps-header { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid rgba(0,0,0,0.07); }
        .apps-header-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .apps-header h1 { font-family: 'Syne', sans-serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.025em; color: #0A0A0F; margin: 0 0 6px; }
        .apps-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .apps-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .apps-badge-blue { background: rgba(37,99,235,0.1); color: #2563EB; }
        .apps-badge-green { background: rgba(16,185,129,0.1); color: #059669; }
      `}</style>

      <div className="apps-header">
        <div className="apps-header-icon">
          <ClipboardList size={24} color="#2563EB" />
        </div>
        <div>
          <h1>My Applications</h1>
          <div className="apps-meta">
            <span className="apps-badge apps-badge-blue">
              {applications.length} tracked
            </span>
            {interviewReadyApplications.length > 0 && (
              <span className="apps-badge apps-badge-green">
                {interviewReadyApplications.length} selected for interview
              </span>
            )}
          </div>
        </div>
      </div>

      <ApplicationsTable />
    </div>
  );
}
