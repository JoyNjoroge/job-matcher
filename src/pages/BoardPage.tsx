/**
 * BoardPage.tsx — Kanban view of tracked applications
 * Fixed: now reads from ApplicationContext (same source as ApplicationsTable)
 * instead of calling getApplications() from the API, which was causing errors.
 */
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Plus } from "lucide-react";
import { useApplications } from "@/contexts/ApplicationContext";
import { useState } from "react";
import { AddApplicationModal } from "@/components/AddApplicationModal";
import type { TrackedApplication } from "@/types";

function categorize(score: number | undefined): "strong" | "medium" | "low" {
  if (!score && score !== 0) return "low";
  if (score >= 70) return "strong";
  if (score >= 40) return "medium";
  return "low";
}

const COLUMNS = [
  {
    key: "strong" as const,
    title: "Strong Fit",
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    scoreMin: 70,
  },
  {
    key: "medium" as const,
    title: "Medium Fit",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    scoreMin: 40,
  },
  {
    key: "low" as const,
    title: "Low / No Score",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
    scoreMin: 0,
  },
];

function KanbanCard({
  app,
  onClick,
}: {
  app: TrackedApplication;
  onClick: () => void;
}) {
  const score = app.analysis?.fit_score;
  const color =
    score === undefined ? "#9CA3AF" : score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";
  const likelihood = app.analysis?.interview_likelihood;

  const likelihoodMap: Record<string, { bg: string; color: string; label: string }> = {
    high:   { bg: "rgba(16,185,129,0.1)",  color: "#059669", label: "High chance" },
    medium: { bg: "rgba(245,158,11,0.1)",  color: "#D97706", label: "Medium chance" },
    low:    { bg: "rgba(239,68,68,0.1)",   color: "#DC2626", label: "Low chance" },
  };
  const lCfg = likelihood ? likelihoodMap[likelihood] : null;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", background: "var(--surface, #fff)",
        border: "1px solid var(--border-color, rgba(0,0,0,0.07))",
        borderRadius: 14, padding: "14px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        cursor: "pointer", transition: "all 0.15s",
        fontFamily: "'DM Sans', sans-serif",
        marginBottom: 10,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text, #0A0A0F)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {app.job.title}
          </p>
          <p style={{ fontSize: 12.5, color: "var(--text2, #6B7280)", margin: "0 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {app.job.company}{app.job.location ? ` · ${app.job.location}` : ""}
          </p>
          {lCfg && (
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "2px 9px", borderRadius: 999,
              background: lCfg.bg, color: lCfg.color,
              fontSize: 11.5, fontWeight: 700,
            }}>
              {lCfg.label}
            </span>
          )}
        </div>

        {/* Score ring */}
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: score !== undefined
            ? `conic-gradient(${color} 0deg, ${color} ${Math.round((score / 100) * 360)}deg, #E5E7EB ${Math.round((score / 100) * 360)}deg)`
            : "#E5E7EB",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            width: 32, height: 32, background: "var(--surface, #fff)",
            borderRadius: "50%", position: "absolute",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color, lineHeight: 1 }}>
              {score !== undefined ? `${score}%` : "—"}
            </span>
          </div>
        </div>
      </div>

      {app.selectedForInterview && (
        <div style={{
          marginTop: 10, padding: "4px 10px", borderRadius: 8,
          background: "rgba(37,99,235,0.07)", color: "#2563EB",
          fontSize: 11.5, fontWeight: 600, display: "inline-block",
        }}>
          ✓ Selected for interview
        </div>
      )}
    </button>
  );
}

function KanbanColumn({
  col,
  apps,
  onCardClick,
}: {
  col: typeof COLUMNS[number];
  apps: TrackedApplication[];
  onCardClick: (app: TrackedApplication) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 300, width: 300 }}>
      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderRadius: 12, marginBottom: 14,
        background: col.bg, border: `1px solid ${col.border}`,
      }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: col.color, fontFamily: "'Syne', sans-serif" }}>
          {col.title}
        </span>
        <span style={{
          background: col.color, color: "white",
          fontSize: 11.5, fontWeight: 700,
          padding: "2px 9px", borderRadius: 999,
        }}>
          {apps.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {apps.map(app => (
          <KanbanCard key={app.id} app={app} onClick={() => onCardClick(app)} />
        ))}
        {apps.length === 0 && (
          <div style={{
            border: "1.5px dashed var(--border-color, rgba(0,0,0,0.1))",
            borderRadius: 12, padding: "28px 16px",
            textAlign: "center", color: "var(--text3, #9CA3AF)",
            fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          }}>
            No applications here
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const navigate = useNavigate();
  const { applications } = useApplications();
  const [showAddModal, setShowAddModal] = useState(false);

  const strong = applications.filter(a => categorize(a.analysis?.fit_score) === "strong");
  const medium = applications.filter(a => categorize(a.analysis?.fit_score) === "medium");
  const low    = applications.filter(a => categorize(a.analysis?.fit_score) === "low");
  const byCol  = { strong, medium, low };

  const handleCardClick = (app: TrackedApplication) => {
    if (app.analysis) {
      navigate("/results", { state: { analysis: app.analysis, job: app.job, cvText: app.cvText } });
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: "48px 24px 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--clr-accent-bg)", color: "var(--clr-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <LayoutGrid size={24} color="currentColor" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 600, letterSpacing: "-0.035em", color: "var(--text, #0A0A0F)", margin: "0 0 4px" }}>
              Application Board
            </h1>
            <p style={{ color: "var(--text2, #6B7280)", fontSize: 14, margin: 0 }}>
              {applications.length} application{applications.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 20px", borderRadius: 7, border: "none",
            background: "var(--clr-accent)", color: "white",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
            cursor: "pointer", boxShadow: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-accent-dark)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-accent)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
        >
          <Plus size={16} /> Add Application
        </button>
      </div>

      {/* Empty state */}
      {applications.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <LayoutGrid size={28} color="#9CA3AF" />
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.2rem", color: "var(--text, #0A0A0F)", margin: "0 0 8px" }}>No applications yet</h3>
          <p style={{ color: "var(--text2, #6B7280)", fontSize: 14, margin: "0 0 24px" }}>
            Apply to jobs or add them manually to see them here.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: "11px 24px", borderRadius: 7, border: "none", background: "var(--clr-accent)", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Add your first application
          </button>
        </div>
      )}

      {/* Kanban columns */}
      {applications.length > 0 && (
        <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              col={col}
              apps={byCol[col.key]}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

      <AddApplicationModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
