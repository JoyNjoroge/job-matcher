import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, CheckCircle, AlertCircle, XCircle, MessageSquare, LayoutGrid, ExternalLink } from "lucide-react";
import type { AnalysisResult } from "@/types";
import { useApplications } from "@/contexts/ApplicationContext";
import { DidYouApplyModal } from "@/components/DidYouApplyModal";

function ScoreRing({ score }: { score: number }) {
  const deg = Math.round((score / 100) * 360);
  const color = score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{
      width: 110, height: 110, borderRadius: "50%", flexShrink: 0, position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `conic-gradient(${color} 0deg, ${color} ${deg}deg, #E5E7EB ${deg}deg)`,
    }}>
      <div style={{
        width: 82, height: 82, background: "white", borderRadius: "50%",
        position: "absolute", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 24, color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.05em", marginTop: 2 }}>FIT</span>
      </div>
    </div>
  );
}

function LikelihoodBadge({ likelihood }: { likelihood: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    high:   { bg: "rgba(16,185,129,0.1)",  color: "#059669", label: "High Interview Chance" },
    medium: { bg: "rgba(245,158,11,0.1)",  color: "#D97706", label: "Medium Interview Chance" },
    low:    { bg: "rgba(239,68,68,0.1)",   color: "#DC2626", label: "Low Interview Chance" },
  };
  const cfg = map[likelihood?.toLowerCase()] || map.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 14px", borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 700, letterSpacing: "0.03em",
    }}>
      {cfg.label}
    </span>
  );
}

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addApplication } = useApplications();

  const analysis  = location.state?.analysis as AnalysisResult | undefined;
  const job       = location.state?.job;       // present when coming from SearchPage/AnalyzePage with a selected job
  const cvText    = location.state?.cvText;

  // "Did you apply?" modal — shown when user clicks Apply from results
  const [showDidYouApply, setShowDidYouApply] = useState(false);
  const [pendingApplyUrl, setPendingApplyUrl] = useState<string | null>(null);

  if (!analysis) {
    return (
      <div style={{ fontFamily: "DM Sans, sans-serif", textAlign: "center", padding: "80px 24px" }}>
        <p style={{ color: "#6B7280", marginBottom: 24 }}>No analysis data available</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px", background: "#2563EB", color: "white",
            border: "none", borderRadius: 10, cursor: "pointer",
            fontFamily: "DM Sans, sans-serif", fontWeight: 600,
          }}
        >
          Go to Analyze
        </button>
      </div>
    );
  }

  const scoreColor = analysis.fit_score >= 70 ? "#10B981" : analysis.fit_score >= 40 ? "#F59E0B" : "#EF4444";

  /** Open job URL then ask "did you apply?" */
  const handleApplyClick = () => {
    const applyUrl = job?.apply_link || job?.application_url;
    if (applyUrl) {
      window.open(applyUrl, "_blank", "noopener,noreferrer");
      setPendingApplyUrl(applyUrl);
      setTimeout(() => setShowDidYouApply(true), 800);
    } else {
      // No URL (paste/URL analysis) — show modal directly
      setShowDidYouApply(true);
    }
  };

  /** User confirmed they applied */
  const handleConfirmApplied = () => {
    if (job) {
      addApplication(job, analysis, cvText);
    } else {
      // External paste/URL job — we don't have full Job object but can still track
      addApplication(
        {
          id: `ext_${Date.now()}`,
          title: analysis.job_title || "External Job",
          company: analysis.company || "Unknown Company",
          location: "",
          description: "",
          apply_link: pendingApplyUrl || "",
        } as any,
        analysis,
        cvText,
      );
    }
    setShowDidYouApply(false);
  };

  return (
    <div className="results-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .results-root { font-family: 'DM Sans', sans-serif; max-width: 780px; margin: 0 auto; padding: 48px 24px 80px; }

        .rs-back-btn { display: inline-flex; align-items: center; gap: 7px; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #6B7280; padding: 0; margin-bottom: 36px; transition: color 0.2s; }
        .rs-back-btn:hover { color: #0A0A0F; }

        .rs-hero { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 24px; padding: 36px; margin-bottom: 24px; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
        .rs-hero-text { flex: 1; min-width: 200px; }
        .rs-hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
        .rs-hero-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.6rem; color: #0A0A0F; margin: 0 0 6px; letter-spacing: -0.02em; }
        .rs-hero-sub { color: #6B7280; font-size: 14px; font-weight: 300; margin: 0 0 14px; }

        .rs-card { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 20px; overflow: hidden; margin-bottom: 16px; }
        .rs-card-header { padding: 20px 24px 16px; display: flex; align-items: center; gap: 10px; }
        .rs-card-header-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rs-card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #0A0A0F; margin: 0; }
        .rs-card-body { padding: 0 24px 24px; }

        .rs-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 14px; color: #374151; line-height: 1.6; }
        .rs-item:last-child { border-bottom: none; }
        .rs-item-icon { flex-shrink: 0; margin-top: 2px; }
        .rs-empty { color: #9CA3AF; font-size: 14px; font-style: italic; padding: 8px 0; }

        .rs-actions { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
        .rs-btn-primary { flex: 1; min-width: 160px; height: 50px; background: #2563EB; color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
        .rs-btn-primary:hover { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
        .rs-btn-outline { flex: 1; min-width: 160px; height: 50px; background: white; color: #0A0A0F; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .rs-btn-outline:hover { border-color: rgba(0,0,0,0.25); background: #F9FAFB; }
        .rs-btn-apply { flex: 1; min-width: 160px; height: 50px; background: #10B981; color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
        .rs-btn-apply:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
      `}</style>

      <button className="rs-back-btn" onClick={() => navigate("/")}>
        <ArrowLeft size={16} /> New Analysis
      </button>

      {/* Score Hero */}
      <div className="rs-hero">
        <ScoreRing score={analysis.fit_score} />
        <div className="rs-hero-text">
          <div className="rs-hero-eyebrow"><Sparkles size={12} /> AI Fit Analysis</div>
          <h2 className="rs-hero-title">
            {analysis.fit_score >= 70 ? "Strong Match" : analysis.fit_score >= 40 ? "Moderate Match" : "Weak Match"}
          </h2>
          <p className="rs-hero-sub">Based on your CV and the job requirements</p>
          <LikelihoodBadge likelihood={analysis.interview_likelihood} />
        </div>
      </div>

      {/* Strengths */}
      <div className="rs-card">
        <div className="rs-card-header">
          <div className="rs-card-header-icon" style={{ background: "rgba(16,185,129,0.1)" }}>
            <CheckCircle size={18} color="#10B981" />
          </div>
          <h3 className="rs-card-title">Your Strengths</h3>
        </div>
        <div className="rs-card-body">
          {analysis.strengths?.length > 0 ? (
            analysis.strengths.map((s, i) => (
              <div key={i} className="rs-item">
                <CheckCircle size={15} color="#10B981" className="rs-item-icon" />{s}
              </div>
            ))
          ) : <p className="rs-empty">No specific strengths identified</p>}
        </div>
      </div>

      {/* Gaps */}
      <div className="rs-card">
        <div className="rs-card-header">
          <div className="rs-card-header-icon" style={{ background: "rgba(245,158,11,0.1)" }}>
            <AlertCircle size={18} color="#F59E0B" />
          </div>
          <h3 className="rs-card-title">Missing Requirements</h3>
        </div>
        <div className="rs-card-body">
          {analysis.gaps?.length > 0 ? (
            analysis.gaps.map((g, i) => (
              <div key={i} className="rs-item">
                <AlertCircle size={15} color="#F59E0B" className="rs-item-icon" />{g}
              </div>
            ))
          ) : <p className="rs-empty">No significant gaps identified</p>}
        </div>
      </div>

      {/* Red Flags */}
      {analysis.red_flags?.length > 0 && (
        <div className="rs-card">
          <div className="rs-card-header">
            <div className="rs-card-header-icon" style={{ background: "rgba(239,68,68,0.1)" }}>
              <XCircle size={18} color="#EF4444" />
            </div>
            <h3 className="rs-card-title">Red Flags</h3>
          </div>
          <div className="rs-card-body">
            {analysis.red_flags.map((r, i) => (
              <div key={i} className="rs-item">
                <XCircle size={15} color="#EF4444" className="rs-item-icon" />{r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rs-actions">
        {/* Apply button — shown for all analyses (selected job OR external paste/URL) */}
        <button className="rs-btn-apply" onClick={handleApplyClick}>
          <ExternalLink size={16} />
          {job?.apply_link ? "Apply & Track" : "Mark as Applied"}
        </button>

        <button className="rs-btn-primary" onClick={() => navigate("/prep")}>
          <MessageSquare size={16} /> Prepare for Interview
        </button>
        <button className="rs-btn-outline" onClick={() => navigate("/board")}>
          <LayoutGrid size={16} /> View Applications
        </button>
      </div>

      {/* Did You Apply? Modal */}
      <DidYouApplyModal
        isOpen={showDidYouApply}
        jobTitle={job?.title || analysis.job_title || "this job"}
        company={job?.company || analysis.company || ""}
        onYes={handleConfirmApplied}
        onNo={() => setShowDidYouApply(false)}
      />
    </div>
  );
}
