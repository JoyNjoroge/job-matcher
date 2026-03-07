/**
 * AddApplicationModal.tsx
 * Lets users manually track any job application — even ones from external boards.
 * Two modes:
 *   1. Paste a job URL → we try to fetch title/company from your API
 *   2. Fill in manually → title, company, location, apply link, notes, optional fit score
 * Optional: upload the CV they applied with to run an analysis.
 */
import { useState, useRef } from "react";
import { X, Link as LinkIcon, PenLine, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useApplications } from "@/contexts/ApplicationContext";
import type { Job, AnalysisResult } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "https://job-matcher-rasg.onrender.com/api";

type Mode = "url" | "manual";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  title: "",
  company: "",
  location: "",
  applyLink: "",
  notes: "",
  fitScore: "",
};

export function AddApplicationModal({ isOpen, onClose }: Props) {
  const { addApplication } = useApplications();

  const [mode, setMode] = useState<Mode>("manual");
  const [form, setForm] = useState(EMPTY_FORM);
  const [jobUrl, setJobUrl] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [urlFetched, setUrlFetched] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setMode("manual");
    setForm(EMPTY_FORM);
    setJobUrl("");
    setCvFile(null);
    setIsFetching(false);
    setIsAnalyzing(false);
    setIsSubmitting(false);
    setFetchError(null);
    setUrlFetched(false);
    setSuccess(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // Try to scrape job details from a URL via your existing API
  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) return;
    setIsFetching(true);
    setFetchError(null);
    setUrlFetched(false);
    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`${API_BASE}/jobs/fetch-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: jobUrl }),
      });
      if (!res.ok) throw new Error("Could not fetch job details from that URL");
      const data = await res.json();
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        company: data.company || f.company,
        location: data.location || f.location,
        applyLink: jobUrl,
      }));
      setUrlFetched(true);
      setMode("manual"); // switch to form to let user review/edit
    } catch (err) {
      // Gracefully fall back — just pre-fill the URL and let them type the rest
      setForm(f => ({ ...f, applyLink: jobUrl }));
      setFetchError("Couldn't auto-fill from that URL — please fill in the details below.");
      setMode("manual");
    } finally {
      setIsFetching(false);
    }
  };

  const canSubmit = form.title.trim() && form.company.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    const job: Job = {
      id: `manual_${Date.now()}`,
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      description: form.notes.trim(),
      apply_link: form.applyLink.trim(),
    };

    let analysis: AnalysisResult | undefined;

    // If they uploaded a CV, run analysis
    if (cvFile && form.notes.trim()) {
      try {
        setIsAnalyzing(true);
        const token = localStorage.getItem("access_token") || "";
        const fd = new FormData();
        fd.append("cv", cvFile);
        fd.append("job_description", form.notes.trim());
        const res = await fetch(`${API_BASE}/analyze`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) analysis = await res.json();
      } catch { /* analysis stays undefined — not a blocker */ }
      finally { setIsAnalyzing(false); }
    } else if (form.fitScore && !isNaN(Number(form.fitScore))) {
      // Manual fit score — synthesise a minimal AnalysisResult
      const score = Math.min(100, Math.max(0, Number(form.fitScore)));
      analysis = {
        fit_score: score,
        interview_likelihood: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
        strengths: [],
        gaps: [],
        red_flags: [],
      };
    }

    addApplication(job, analysis, undefined);
    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => { handleClose(); }, 1200);
  };

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <style>{`
        .aam-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: aamFadeIn 0.18s ease;
        }
        @keyframes aamFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .aam-modal {
          background: var(--surface, #fff);
          border: 1px solid var(--border-color, rgba(0,0,0,0.08));
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.18);
          width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          animation: aamSlideUp 0.22s cubic-bezier(0.4,0,0.2,1);
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes aamSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .aam-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 0;
        }
        .aam-title {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.15rem;
          color: var(--text, #0A0A0F); letter-spacing: -0.02em;
        }
        .aam-close {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: var(--surface2, #F2F2EF); color: var(--text2, #6B7280);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .aam-close:hover { background: rgba(239,68,68,0.1); color: #EF4444; }

        .aam-body { padding: 20px 24px 24px; }

        /* Mode toggle */
        .aam-mode-row { display: flex; gap: 8px; margin-bottom: 20px; }
        .aam-mode-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 9px 14px; border-radius: 10px; border: 1.5px solid transparent;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .aam-mode-btn.active { background: var(--clr-accent, #2563EB); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
        .aam-mode-btn.inactive { background: var(--surface2, #F2F2EF); color: var(--text2, #6B7280); border-color: transparent; }
        .aam-mode-btn.inactive:hover { color: var(--text, #0A0A0F); }

        /* URL section */
        .aam-url-row { display: flex; gap: 8px; margin-bottom: 14px; }
        .aam-url-input {
          flex: 1; height: 42px; padding: 0 13px;
          border: 1.5px solid var(--border-color, rgba(0,0,0,0.1));
          border-radius: 10px; background: var(--surface, #fff);
          color: var(--text, #0A0A0F); font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .aam-url-input:focus { border-color: var(--clr-accent, #2563EB); box-shadow: 0 0 0 3px var(--clr-accent-bg, rgba(37,99,235,0.08)); }
        .aam-fetch-btn {
          height: 42px; padding: 0 16px; border-radius: 10px; border: none;
          background: var(--clr-accent, #2563EB); color: white;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .aam-fetch-btn:hover { background: var(--clr-accent-dark, #1D4ED8); }
        .aam-fetch-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Form fields */
        .aam-field { margin-bottom: 14px; }
        .aam-label { font-size: 12.5px; font-weight: 600; color: var(--text, #0A0A0F); margin-bottom: 5px; display: block; }
        .aam-label span { color: var(--text3, #9CA3AF); font-weight: 400; margin-left: 4px; }
        .aam-input {
          width: 100%; height: 42px; padding: 0 13px;
          border: 1.5px solid var(--border-color, rgba(0,0,0,0.1));
          border-radius: 10px; background: var(--surface, #fff);
          color: var(--text, #0A0A0F); font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .aam-input:focus { border-color: var(--clr-accent, #2563EB); box-shadow: 0 0 0 3px var(--clr-accent-bg, rgba(37,99,235,0.08)); }
        .aam-textarea {
          width: 100%; padding: 11px 13px; min-height: 90px; resize: vertical;
          border: 1.5px solid var(--border-color, rgba(0,0,0,0.1));
          border-radius: 10px; background: var(--surface, #fff);
          color: var(--text, #0A0A0F); font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; line-height: 1.6;
        }
        .aam-textarea:focus { border-color: var(--clr-accent, #2563EB); box-shadow: 0 0 0 3px var(--clr-accent-bg, rgba(37,99,235,0.08)); }

        .aam-row { display: flex; gap: 12px; }
        .aam-row .aam-field { flex: 1; }

        /* CV upload */
        .aam-cv-zone {
          border: 1.5px dashed var(--border-color, rgba(0,0,0,0.12));
          border-radius: 12px; padding: 16px; text-align: center;
          cursor: pointer; transition: all 0.15s; background: var(--surface2, #F8F8F6);
        }
        .aam-cv-zone:hover { border-color: var(--clr-accent, #2563EB); background: var(--clr-accent-bg, rgba(37,99,235,0.04)); }
        .aam-cv-zone.has-file { border-color: #10B981; background: rgba(16,185,129,0.05); }
        .aam-cv-label { font-size: 13px; color: var(--text2, #6B7280); margin-top: 6px; }
        .aam-cv-name { font-size: 12.5px; font-weight: 600; color: #10B981; margin-top: 4px; }

        /* Alerts */
        .aam-error {
          display: flex; gap: 8px; align-items: flex-start;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px; padding: 11px 13px; font-size: 13px; color: #DC2626;
          margin-bottom: 14px;
        }
        .aam-fetched-notice {
          display: flex; gap: 8px; align-items: center;
          background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.2);
          border-radius: 10px; padding: 10px 13px; font-size: 13px; color: #059669;
          margin-bottom: 14px;
        }
        .aam-success {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 40px 24px; gap: 12px; text-align: center;
        }
        .aam-success-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(16,185,129,0.1); display: flex; align-items: center; justify-content: center; }
        .aam-success-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text, #0A0A0F); }
        .aam-success-sub { font-size: 13.5px; color: var(--text2, #6B7280); }

        /* Footer */
        .aam-footer { display: flex; gap: 10px; margin-top: 20px; }
        .aam-cancel-btn {
          flex: 1; height: 44px; border-radius: 11px;
          border: 1.5px solid var(--border-color, rgba(0,0,0,0.1));
          background: var(--surface2, #F2F2EF); color: var(--text2, #6B7280);
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .aam-cancel-btn:hover { color: var(--text, #0A0A0F); }
        .aam-submit-btn {
          flex: 2; height: 44px; border-radius: 11px; border: none;
          background: var(--clr-accent, #2563EB); color: white;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }
        .aam-submit-btn:hover:not(:disabled) { background: var(--clr-accent-dark, #1D4ED8); transform: translateY(-1px); }
        .aam-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .aam-divider { height: 1px; background: var(--border-color, rgba(0,0,0,0.07)); margin: 18px 0; }
        .aam-section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text3, #9CA3AF); margin-bottom: 10px; display: block; }
      `}</style>

      <div className="aam-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div className="aam-modal">
          <div className="aam-header">
            <span className="aam-title">Track an Application</span>
            <button className="aam-close" onClick={handleClose}><X size={15} /></button>
          </div>

          <div className="aam-body">
            {success ? (
              <div className="aam-success">
                <div className="aam-success-icon"><CheckCircle2 size={28} color="#10B981" /></div>
                <p className="aam-success-title">Application Tracked!</p>
                <p className="aam-success-sub">It's now in your Applications board.</p>
              </div>
            ) : (
              <>
                {/* Mode toggle */}
                <div className="aam-mode-row">
                  <button className={`aam-mode-btn ${mode === "url" ? "active" : "inactive"}`} onClick={() => setMode("url")}>
                    <LinkIcon size={14} /> From Job URL
                  </button>
                  <button className={`aam-mode-btn ${mode === "manual" ? "active" : "inactive"}`} onClick={() => setMode("manual")}>
                    <PenLine size={14} /> Fill Manually
                  </button>
                </div>

                {/* URL mode */}
                {mode === "url" && (
                  <div className="aam-field">
                    <label className="aam-label">Job posting URL</label>
                    <div className="aam-url-row">
                      <input
                        className="aam-url-input"
                        type="url"
                        placeholder="https://linkedin.com/jobs/view/..."
                        value={jobUrl}
                        onChange={e => setJobUrl(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleFetchUrl()}
                      />
                      <button className="aam-fetch-btn" onClick={handleFetchUrl} disabled={isFetching || !jobUrl.trim()}>
                        {isFetching ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : null}
                        {isFetching ? "Fetching…" : "Auto-fill"}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                      We'll try to extract the job title and company automatically.
                    </p>
                  </div>
                )}

                {fetchError && (
                  <div className="aam-error">
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    {fetchError}
                  </div>
                )}

                {urlFetched && (
                  <div className="aam-fetched-notice">
                    <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                    Details auto-filled — review and edit below before saving.
                  </div>
                )}

                {/* Manual form — always visible after URL attempt too */}
                {(mode === "manual" || urlFetched || fetchError) && (
                  <>
                    <div className="aam-row">
                      <div className="aam-field">
                        <label className="aam-label">Job Title <span>*</span></label>
                        <input className="aam-input" placeholder="e.g. Senior Frontend Engineer" value={form.title} onChange={set("title")} />
                      </div>
                      <div className="aam-field">
                        <label className="aam-label">Company <span>*</span></label>
                        <input className="aam-input" placeholder="e.g. Acme Corp" value={form.company} onChange={set("company")} />
                      </div>
                    </div>

                    <div className="aam-row">
                      <div className="aam-field">
                        <label className="aam-label">Location <span>(optional)</span></label>
                        <input className="aam-input" placeholder="e.g. Remote / Nairobi" value={form.location} onChange={set("location")} />
                      </div>
                      <div className="aam-field">
                        <label className="aam-label">Fit Score % <span>(optional)</span></label>
                        <input className="aam-input" type="number" min="0" max="100" placeholder="e.g. 78" value={form.fitScore} onChange={set("fitScore")} />
                      </div>
                    </div>

                    <div className="aam-field">
                      <label className="aam-label">Application / Job URL <span>(optional)</span></label>
                      <input className="aam-input" type="url" placeholder="https://..." value={form.applyLink} onChange={set("applyLink")} />
                    </div>

                    <div className="aam-field">
                      <label className="aam-label">
                        Job Description / Notes
                        <span>(paste JD here to get an AI fit score when you upload your CV)</span>
                      </label>
                      <textarea className="aam-textarea" placeholder="Paste the job description or add any notes…" value={form.notes} onChange={set("notes")} />
                    </div>

                    {/* CV upload */}
                    <div className="aam-divider" />
                    <span className="aam-section-label">Optional — Upload CV for AI analysis</span>
                    <div
                      className={`aam-cv-zone ${cvFile ? "has-file" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        style={{ display: "none" }}
                        onChange={e => setCvFile(e.target.files?.[0] || null)}
                      />
                      <Upload size={20} color={cvFile ? "#10B981" : "var(--text3, #9CA3AF)"} />
                      <p className="aam-cv-label">
                        {cvFile ? "CV uploaded" : "Click to upload CV (PDF, DOC, TXT)"}
                      </p>
                      {cvFile && <p className="aam-cv-name">{cvFile.name}</p>}
                    </div>
                    {cvFile && !form.notes.trim() && (
                      <p style={{ fontSize: 12, color: "var(--warning, #F59E0B)", marginTop: 6 }}>
                        ⚠ Paste a job description above to get an AI fit score with your CV.
                      </p>
                    )}
                    {isAnalyzing && (
                      <p style={{ fontSize: 13, color: "var(--clr-accent)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} /> Analyzing your CV…
                      </p>
                    )}
                  </>
                )}

                <div className="aam-footer">
                  <button className="aam-cancel-btn" onClick={handleClose}>Cancel</button>
                  <button
                    className="aam-submit-btn"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting || isAnalyzing || isFetching}
                  >
                    {isSubmitting || isAnalyzing
                      ? <><Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} /> Saving…</>
                      : "Save Application"
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
