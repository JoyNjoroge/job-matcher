import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileSearch, Link as LinkIcon, FileText, X, Send, Upload, AlertCircle } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { ApplyConfirmationModal } from "@/components/ApplyConfirmationModal";
import { useApplications } from "@/contexts/ApplicationContext";
import { analyzeJob } from "@/api";
import { cn } from "@/lib/utils";
import type { Job, AnalysisResult } from "@/types";

type InputMode = "description" | "url";
const FIT_SCORE_THRESHOLD = 70;

interface LocationState { selectedJob?: Job; }

export default function AnalyzePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { addApplication, applications } = useApplications();

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState<string>("");
  const [inputMode, setInputMode] = useState<InputMode>("description");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (state?.selectedJob) {
      setSelectedJob(state.selectedJob);
      setJobDescription(state.selectedJob.description);
      setCompanyName(state.selectedJob.company);
      window.history.replaceState({}, document.title);
    }
  }, [state?.selectedJob]);

  useEffect(() => {
    if (cvFile) {
      const reader = new FileReader();
      reader.onload = (e) => setCvText(e.target?.result as string || "");
      reader.readAsText(cvFile);
    }
  }, [cvFile]);

  const clearSelectedJob = () => {
    setSelectedJob(null);
    setJobDescription("");
    setCompanyName("");
    setAnalysisResult(null);
  };

  const canSubmit = cvFile && (selectedJob || (inputMode === "description" ? jobDescription.trim() : jobUrl.trim()));

  const isAlreadyApplied = selectedJob && applications.some(
    (app) => app.job.id === selectedJob.id || (app.job.title === selectedJob.title && app.job.company === selectedJob.company)
  );

  const handleSubmit = async () => {
    if (!cvFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const submittedJobDescription = selectedJob
        ? selectedJob.description
        : inputMode === "description"
          ? jobDescription
          : "";
      const submittedCompany = selectedJob?.company || companyName.trim();
      const submittedJobTitle = selectedJob?.title || "";

      const result = await analyzeJob(cvFile, {
        job_description: submittedJobDescription || undefined,
        job_url: !selectedJob && inputMode === "url" ? jobUrl : undefined,
        job_title: submittedJobTitle || undefined,
        company: submittedCompany || undefined,
      });
      setAnalysisResult(result);
      navigate("/results", {
        state: {
          analysis: result,
          job: selectedJob,
          cvText,
          // Prefer the server value because it is the exact cleaned (or
          // URL-scraped) description used by the fit analysis.
          jobDescription: result.job_description || submittedJobDescription,
          companyName: result.company || submittedCompany,
          jobTitle: result.job_title || submittedJobTitle,
          jobUrl: result.job_url || (!selectedJob && inputMode === "url" ? jobUrl.trim() : ""),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (selectedJob) { window.open(selectedJob.apply_link, "_blank", "noopener,noreferrer"); setShowApplyModal(true); }
  };

  const handleConfirmApplication = () => {
    if (selectedJob) { addApplication(selectedJob, analysisResult || undefined, cvText); setShowApplyModal(false); }
  };

  const showProceedToApply = selectedJob && analysisResult && analysisResult.fit_score >= FIT_SCORE_THRESHOLD;

  return (
    <div className="analyze-root p-root">
      <style>{`
        .analyze-root { font-family: var(--font-ui); max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }

        .an-header { text-align: center; margin-bottom: 48px; }
        .an-icon-wrap {
          width: 60px; height: 60px; border-radius: 18px;
          background: rgba(37,99,235,0.08);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }
        .an-title { font-family: var(--font-ui); font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: -0.025em; color: #0A0A0F; margin: 0 0 10px; }
        .an-sub { color: #6B7280; font-size: 15px; font-weight: 300; margin: 0; }

        .an-section { margin-bottom: 28px; }
        .an-section-label { font-size: 13px; font-weight: 600; color: #0A0A0F; margin-bottom: 10px; display: block; }

        /* Toggle */
        .an-toggle { display: flex; gap: 8px; margin-bottom: 14px; }
        .an-toggle-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; border: 1.5px solid transparent;
          font-family: var(--font-ui);
        }
        .an-toggle-btn.active {
          background: #2563EB; color: white;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }
        .an-toggle-btn.inactive {
          background: white; color: #6B7280;
          border-color: rgba(0,0,0,0.1);
        }
        .an-toggle-btn.inactive:hover { border-color: rgba(0,0,0,0.2); color: #0A0A0F; }

        /* Textarea / Input */
        .an-textarea {
          width: 100%; min-height: 200px; padding: 14px 16px;
          border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px;
          font-family: var(--font-ui); font-size: 14px; color: #0A0A0F;
          background: white; resize: vertical; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; line-height: 1.65;
          box-sizing: border-box;
        }
        .an-textarea:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .an-input {
          width: 100%; height: 44px; padding: 0 14px;
          border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px;
          font-family: var(--font-ui); font-size: 14px; color: #0A0A0F;
          background: white; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .an-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

        /* Selected job */
        .an-job-card {
          background: rgba(37,99,235,0.04);
          border: 1.5px solid rgba(37,99,235,0.2);
          border-radius: 14px; padding: 18px 20px;
          display: flex; align-items: flex-start; gap: 14px;
        }
        .an-job-info { flex: 1; }
        .an-job-title { font-family: var(--font-ui); font-weight: 700; font-size: 15px; color: #0A0A0F; margin: 0 0 4px; }
        .an-job-meta { font-size: 13px; color: #6B7280; margin: 0 0 6px; }
        .an-job-desc { font-size: 12px; color: #9CA3AF; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .an-job-clear {
          width: 32px; height: 32px; border-radius: 8px;
          border: none; background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #9CA3AF; flex-shrink: 0;
          transition: background 0.2s, color 0.2s;
        }
        .an-job-clear:hover { background: rgba(0,0,0,0.06); color: #0A0A0F; }

        /* Error */
        .an-error {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 14px 16px;
          font-size: 13px; color: #DC2626; margin-bottom: 20px;
        }

        /* Buttons */
        .an-submit-btn {
          width: 100%; height: 52px;
          background: #2563EB; color: white;
          border: none; border-radius: 12px;
          font-family: var(--font-ui); font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 6px 20px rgba(37,99,235,0.3);
          margin-bottom: 12px;
        }
        .an-submit-btn:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(37,99,235,0.4); }
        .an-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .an-apply-btn {
          width: 100%; height: 48px;
          background: white; color: #2563EB;
          border: 1.5px solid #2563EB; border-radius: 12px;
          font-family: var(--font-ui); font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 12px;
        }
        .an-apply-btn:hover { background: rgba(37,99,235,0.05); }

        .an-already-applied {
          text-align: center; font-size: 13px; color: #6B7280;
          background: rgba(0,0,0,0.04); border-radius: 10px; padding: 12px;
        }

        .an-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="an-header">
        <div className="an-icon-wrap">
          <FileSearch size={26} color="#2563EB" />
        </div>
        <h1 className="an-title">Analyze Your Fit</h1>
        <p className="an-sub">Upload your CV and provide job details to get an instant AI-powered analysis</p>
      </div>

      {/* CV Upload */}
      <div className="an-section">
        <span className="an-section-label">Your CV</span>
        <FileUpload file={cvFile} onFileSelect={setCvFile} />
      </div>

      {/* Job Input */}
      <div className="an-section">
        <span className="an-section-label">Job Details</span>

        {selectedJob ? (
          <div className="an-job-card">
            <div className="an-job-info">
              <p className="an-job-title">{selectedJob.title}</p>
              <p className="an-job-meta">{selectedJob.company} · {selectedJob.location}</p>
              <p className="an-job-desc">{selectedJob.description}</p>
            </div>
            <button className="an-job-clear" onClick={clearSelectedJob} aria-label="Remove job">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="an-toggle">
              <button
                className={`an-toggle-btn ${inputMode === "description" ? "active" : "inactive"}`}
                onClick={() => setInputMode("description")}
              >
                <FileText size={14} /> Paste Description
              </button>
              <button
                className={`an-toggle-btn ${inputMode === "url" ? "active" : "inactive"}`}
                onClick={() => setInputMode("url")}
              >
                <LinkIcon size={14} /> Job URL
              </button>
            </div>

            {inputMode === "description" ? (
              <textarea
                className="an-textarea"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            ) : (
              <input
                type="url"
                className="an-input"
                placeholder="https://company.com/careers/position"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            )}

            <div style={{ marginTop: 14 }}>
              <label className="an-section-label" htmlFor="analysis-company">
                Company name <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="analysis-company"
                className="an-input"
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="an-error">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <button
        className="an-submit-btn"
        onClick={handleSubmit}
        disabled={!canSubmit || isLoading}
      >
        {isLoading ? (
          <><div className="an-spinner" /> Analyzing with AI...</>
        ) : (
          <><FileSearch size={18} /> Analyze Job Fit</>
        )}
      </button>

      {showProceedToApply && !isAlreadyApplied && (
        <button className="an-apply-btn" onClick={handleApplyClick}>
          <Send size={15} />
          Apply Now · Score: {analysisResult.fit_score}%
        </button>
      )}

      {isAlreadyApplied && (
        <div className="an-already-applied">You've already applied to this position</div>
      )}

      <ApplyConfirmationModal
        job={selectedJob}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onConfirm={handleConfirmApplication}
      />
    </div>
  );
}
