import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, AlertCircle } from "lucide-react";
import { KanbanColumn } from "@/components/KanbanColumn";
import { getApplications } from "@/api";
import type { Application, FitCategory } from "@/types";

function categorizeByFit(score: number): FitCategory {
  if (score >= 70) return "strong";
  if (score >= 40) return "medium";
  return "low";
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(37,99,235,0.2)", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ color: "#6B7280", fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>Loading applications…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function BoardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleApplicationClick = (app: Application) => {
    navigate("/results", {
      state: {
        analysis: app.analysis || { fit_score: app.fit_score, interview_likelihood: app.interview_likelihood, strengths: [], gaps: [], red_flags: [] },
      },
    });
  };

  const strong = applications.filter((a) => categorizeByFit(a.fit_score) === "strong");
  const medium = applications.filter((a) => categorizeByFit(a.fit_score) === "medium");
  const low = applications.filter((a) => categorizeByFit(a.fit_score) === "low");

  return (
    <div className="board-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .board-root { font-family: 'DM Sans', sans-serif; padding: 48px 24px 80px; }
        .board-header { display: flex; align-items: center; gap: 18px; margin-bottom: 40px; }
        .board-header-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .board-header h1 { font-family: 'Syne', sans-serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.025em; color: #0A0A0F; margin: 0 0 4px; }
        .board-header p { color: #6B7280; font-size: 14px; margin: 0; }
        .board-cols { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 16px; align-items: flex-start; }
        .board-cols::-webkit-scrollbar { height: 6px; }
        .board-cols::-webkit-scrollbar-track { background: transparent; }
        .board-cols::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 999px; }

        .board-error {
          display: flex; gap: 12px; align-items: center;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 14px; padding: 16px 20px;
          color: #DC2626; font-size: 14px;
        }
        .board-retry-btn {
          margin-left: auto; padding: 8px 16px; background: white;
          border: 1.5px solid rgba(239,68,68,0.3); border-radius: 8px;
          color: #DC2626; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .board-retry-btn:hover { background: rgba(239,68,68,0.06); }
      `}</style>

      <div className="board-header">
        <div className="board-header-icon">
          <LayoutGrid size={24} color="#2563EB" />
        </div>
        <div>
          <h1>Application Board</h1>
          <p>{applications.length} application{applications.length !== 1 ? "s" : ""} tracked</p>
        </div>
      </div>

      {isLoading && <LoadingState />}

      {error && (
        <div className="board-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          {error}
          <button className="board-retry-btn" onClick={fetchApplications}>Retry</button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="board-cols">
          <KanbanColumn title="Strong Fit" category="strong" applications={strong} onApplicationClick={handleApplicationClick} />
          <KanbanColumn title="Medium Fit" category="medium" applications={medium} onApplicationClick={handleApplicationClick} />
          <KanbanColumn title="Low Fit" category="low" applications={low} onApplicationClick={handleApplicationClick} />
        </div>
      )}
    </div>
  );
}
