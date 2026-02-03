import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileSearch, Link as LinkIcon, FileText, X, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/FileUpload";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ApplyConfirmationModal } from "@/components/ApplyConfirmationModal";
import { useApplications } from "@/contexts/ApplicationContext";
import { analyzeJob } from "@/api";
import { cn } from "@/lib/utils";
import type { Job, AnalysisResult } from "@/types";

type InputMode = "description" | "url";

const FIT_SCORE_THRESHOLD = 70;

interface LocationState {
  selectedJob?: Job;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Handle job coming from Search page
  useEffect(() => {
    if (state?.selectedJob) {
      setSelectedJob(state.selectedJob);
      setJobDescription(state.selectedJob.description);
      // Clear the location state to prevent re-filling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [state?.selectedJob]);

  const clearSelectedJob = () => {
    setSelectedJob(null);
    setJobDescription("");
    setAnalysisResult(null);
  };

  const canSubmit =
    cvFile && (selectedJob || (inputMode === "description" ? jobDescription.trim() : jobUrl.trim()));

  const isAlreadyApplied = selectedJob && applications.some(
    (app) => app.job.id === selectedJob.id || (app.job.title === selectedJob.title && app.job.company === selectedJob.company)
  );

  // Read CV text when file is selected
  useEffect(() => {
    if (cvFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Store raw text for context (actual parsing happens on backend)
        setCvText(e.target?.result as string || "");
      };
      reader.readAsText(cvFile);
    }
  }, [cvFile]);

  const handleSubmit = async () => {
    if (!cvFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeJob(cvFile, {
        job_description: selectedJob ? selectedJob.description : (inputMode === "description" ? jobDescription : undefined),
        job_url: !selectedJob && inputMode === "url" ? jobUrl : undefined,
      });

      setAnalysisResult(result);
      navigate("/results", { 
        state: { 
          analysis: result,
          job: selectedJob,
          cvText: cvText 
        } 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze job. Please check your inputs and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (selectedJob) {
      window.open(selectedJob.apply_link, "_blank", "noopener,noreferrer");
      setShowApplyModal(true);
    }
  };

  const handleConfirmApplication = () => {
    if (selectedJob) {
      addApplication(selectedJob, analysisResult || undefined, cvText);
      setShowApplyModal(false);
    }
  };

  const showProceedToApply = selectedJob && analysisResult && analysisResult.fit_score >= FIT_SCORE_THRESHOLD;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <FileSearch className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Analyze Your Fit</h1>
        <p className="text-muted-foreground mt-2">
          Upload your CV and provide job details to get instant analysis
        </p>
      </div>

      <div className="space-y-8">
        {/* CV Upload */}
        <section>
          <label className="block text-sm font-medium text-foreground mb-3">
            Your CV
          </label>
          <FileUpload file={cvFile} onFileSelect={setCvFile} />
        </section>

        {/* Job Input */}
        <section>
          <label className="block text-sm font-medium text-foreground mb-3">
            Job Details
          </label>

          {/* Selected Job from Search */}
          {selectedJob ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{selectedJob.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedJob.company} • {selectedJob.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {selectedJob.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelectedJob}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMode("description")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    inputMode === "description"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Paste Description
                </button>
                <button
                  onClick={() => setInputMode("url")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    inputMode === "url"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LinkIcon className="h-4 w-4" />
                  Job URL
                </button>
              </div>

              {inputMode === "description" ? (
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              ) : (
                <Input
                  type="url"
                  placeholder="https://company.com/jobs/position"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
              )}
            </>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2 text-primary-foreground" />
              Analyzing...
            </>
          ) : (
            "Analyze Job"
          )}
        </Button>

        {/* Proceed to Apply - shown after successful analysis with good fit */}
        {showProceedToApply && !isAlreadyApplied && (
          <Button
            onClick={handleApplyClick}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Apply Now (Score: {analysisResult.fit_score}%)
          </Button>
        )}
        
        {isAlreadyApplied && (
          <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg py-3">
            You've already applied to this position
          </div>
        )}
      </div>

      <ApplyConfirmationModal
        job={selectedJob}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onConfirm={handleConfirmApplication}
      />
    </div>
  );
}
