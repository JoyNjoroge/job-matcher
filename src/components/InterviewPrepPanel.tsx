import { useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewQuestion } from "@/components/InterviewQuestion";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { InterviewPrepData, TrackedApplication } from "@/types";

interface InterviewPrepPanelProps {
  application: TrackedApplication;
}

export function InterviewPrepPanel({ application }: InterviewPrepPanelProps) {
  const [prepData, setPrepData] = useState<InterviewPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePrep = async () => {
    setIsLoading(true);
    setError(null);

    // Validate inputs before calling API
    const jobDescription = application.job.description?.trim();
    const cvText = application.cvText?.trim();

    if (!jobDescription) {
      setError("Job description is missing. Cannot generate interview prep.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/interview-prep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: application.id,
          job_title: application.job.title,
          company: application.job.company,
          job_description: jobDescription,
          cv_text: cvText || "",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate interview prep");
      }

      const data = await response.json();
      setPrepData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate prep");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{application.job.title}</h3>
            <p className="text-sm text-muted-foreground">{application.job.company}</p>
          </div>
          {application.analysis && (
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{application.analysis.fit_score}%</p>
              <p className="text-xs text-muted-foreground">Fit Score</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {application.job.description}
          </p>
        </div>
      </div>

      {!prepData && !isLoading && (
        <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
          <h4 className="font-medium text-foreground mb-2">Generate Interview Prep</h4>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            AI will analyze the job description{application.cvText ? " and your CV" : ""} to generate
            5 tailored interview questions with suggested answers.
          </p>
          <Button onClick={handleGeneratePrep} size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Prep
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Generating interview questions...</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Unable to Generate Prep</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePrep}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {prepData && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Interview Questions
          </h4>
          {prepData.questions.map((q, index) => (
            <InterviewQuestion
              key={index}
              index={index}
              question={q.question}
              whatTheyTest={q.what_they_test}
              talkingPoints={q.talking_points}
            />
          ))}
        </div>
      )}
    </div>
  );
}
