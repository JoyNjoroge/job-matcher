import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FitScoreRing } from "@/components/FitScoreRing";
import { LikelihoodBadge } from "@/components/LikelihoodBadge";
import { AnalysisCard } from "@/components/AnalysisCard";
import type { AnalysisResult } from "@/types";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis as AnalysisResult | undefined;

  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">No analysis data available</p>
        <Button onClick={() => navigate("/")}>Go to Analyze</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        New Analysis
      </Button>

      {/* Score Header */}
      <div className="rounded-2xl border border-border bg-card p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <FitScoreRing score={analysis.fit_score} size="lg" />
          
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Fit Score Analysis
              </h2>
            </div>
            <p className="text-muted-foreground mb-3">
              Based on your CV and the job requirements
            </p>
            <LikelihoodBadge likelihood={analysis.interview_likelihood} />
          </div>
        </div>
      </div>

      {/* Analysis Cards */}
      <div className="grid gap-6">
        <AnalysisCard
          title="Your Strengths"
          items={analysis.strengths}
          type="strengths"
        />
        <AnalysisCard
          title="Missing Requirements"
          items={analysis.gaps}
          type="gaps"
        />
        <AnalysisCard
          title="Red Flags"
          items={analysis.red_flags}
          type="red_flags"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Button onClick={() => navigate("/prep")} className="flex-1">
          Prepare for Interview
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/board")}
          className="flex-1"
        >
          View All Applications
        </Button>
      </div>
    </div>
  );
}
