// PrepPage.tsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, ChevronDown, AlertCircle } from "lucide-react";
import { useApplications } from "@/contexts/ApplicationContext";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import type { TrackedApplication } from "@/types";

interface LocationState { applicationId?: string; }

export default function PrepPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { interviewReadyApplications, getApplicationById } = useApplications();
  const [selectedApp, setSelectedApp] = useState<TrackedApplication | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (state?.applicationId) {
      const app = getApplicationById(state.applicationId);
      if (app) setSelectedApp(app);
      window.history.replaceState({}, document.title);
    } else if (interviewReadyApplications.length > 0 && !selectedApp) {
      setSelectedApp(interviewReadyApplications[0]);
    }
  }, [state?.applicationId, interviewReadyApplications, getApplicationById, selectedApp]);

  if (interviewReadyApplications.length === 0) {
    return (
      <div className="prep-root">
        <style>{`
          .prep-root { font-family: var(--font-ui); max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
        `}</style>
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ width: 72, height: 72, background: "rgba(0,0,0,0.04)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#9CA3AF" }}>
            <MessageSquare size={30} />
          </div>
          <h2 style={{ fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: "1.4rem", color: "#0A0A0F", margin: "0 0 10px" }}>No Applications Selected</h2>
          <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: "0 auto 24px" }}>
            Go to your Applications page and check "Selected for Interview" on the roles you want to prepare for.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: "12px 18px", width: "fit-content", margin: "0 auto", fontSize: 13, color: "#2563EB" }}>
            <AlertCircle size={15} />
            <span>Tip: Use the checkbox in the "Interview" column to select applications</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prep-root">
      <style>{`
        .prep-root { font-family: var(--font-ui); max-width: 840px; margin: 0 auto; padding: 48px 24px 80px; }
        .prep-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid rgba(0,0,0,0.07); flex-wrap: wrap; }
        .prep-header-left { display: flex; align-items: center; gap: 16px; }
        .prep-header-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .prep-header h1 { font-family: var(--font-ui); font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; letter-spacing: -0.025em; color: #0A0A0F; margin: 0 0 4px; }
        .prep-header p { color: #6B7280; font-size: 14px; margin: 0; font-weight: 300; }

        /* Dropdown */
        .prep-selector { position: relative; }
        .prep-selector-btn { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: white; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; cursor: pointer; font-family: var(--font-ui); font-size: 13px; font-weight: 600; color: #0A0A0F; transition: all 0.2s; }
        .prep-selector-btn:hover { border-color: rgba(37,99,235,0.3); }
        .prep-selector-text { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prep-dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 280px; background: white; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.12); z-index: 50; overflow: hidden; }
        .prep-dropdown-item { padding: 12px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid rgba(0,0,0,0.04); }
        .prep-dropdown-item:last-child { border-bottom: none; }
        .prep-dropdown-item:hover { background: rgba(37,99,235,0.04); }
        .prep-dropdown-item.active { background: rgba(37,99,235,0.06); }
        .prep-dropdown-title { font-weight: 600; font-size: 14px; color: #0A0A0F; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prep-dropdown-sub { font-size: 12px; color: #6B7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .chevron-anim { transition: transform 0.2s; }
        .chevron-anim.open { transform: rotate(180deg); }
      `}</style>

      <div className="prep-header">
        <div className="prep-header-left">
          <div className="prep-header-icon"><MessageSquare size={24} color="#2563EB" /></div>
          <div>
            <h1>Interview Prep</h1>
            <p>AI-generated questions tailored to your CV and the role</p>
          </div>
        </div>

        {interviewReadyApplications.length > 1 && (
          <div className="prep-selector">
            <button className="prep-selector-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span className="prep-selector-text">
                {selectedApp?.job.title} · {selectedApp?.job.company}
              </span>
              <ChevronDown size={16} className={`chevron-anim${isDropdownOpen ? " open" : ""}`} style={{ color: "#9CA3AF" }} />
            </button>
            {isDropdownOpen && (
              <div className="prep-dropdown">
                {interviewReadyApplications.map((app) => (
                  <div key={app.id} className={`prep-dropdown-item${app.id === selectedApp?.id ? " active" : ""}`} onClick={() => { setSelectedApp(app); setIsDropdownOpen(false); }}>
                    <div className="prep-dropdown-title">{app.job.title}</div>
                    <div className="prep-dropdown-sub">{app.job.company}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedApp && <InterviewPrepPanel application={selectedApp} />}
    </div>
  );
}
