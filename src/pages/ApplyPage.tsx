import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, FileText, CheckSquare, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { FitScoreRing } from "@/components/FitScoreRing";
import { LikelihoodBadge } from "@/components/LikelihoodBadge";
import { prepareApplication } from "@/api";
import type { Job, AnalysisResult, ApplyPrepData } from "@/types";

interface LocationState {
  job: Job;
  analysis: AnalysisResult;
}

export default function ApplyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [prepData, setPrepData] = useState<ApplyPrepData | null>(null);
  const [draftEmail, setDraftEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.job || !state?.analysis) {
      navigate("/search");
      return;
    }

    const fetchPrepData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await prepareApplication(state.job.id);
        setPrepData(data);
        setDraftEmail(data.draft_email);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to prepare application");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrepData();
  }, [state, navigate]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!state?.job || !state?.analysis) {
    return null;
  }

  const { job, analysis } = state;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <Send className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Prepare Application</h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered assistance to craft your application
        </p>
      </div>

      {/* Job Summary */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{job.company} • {job.location}</p>
            </div>
            <div className="flex items-center gap-4">
              <FitScoreRing score={analysis.fit_score} size="sm" />
              <LikelihoodBadge likelihood={analysis.interview_likelihood} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild>
              <a href={job.apply_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Now
              </a>
            </Button>
            <Button variant="outline" onClick={() => navigate("/prep", { state: { job, analysis } })}>
              Interview Prep
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading / Error States */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

      {/* Prep Content */}
      {!isLoading && !error && prepData && (
        <div className="space-y-6">
          {/* Draft Email */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Application Email Draft
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(draftEmail, "email")}
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Feel free to edit this draft before using it
              </p>
            </CardContent>
          </Card>

          {/* Resume Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resume Tailoring Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {prepData.resume_suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* ATS Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                ATS Compatibility Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {prepData.ats_notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
