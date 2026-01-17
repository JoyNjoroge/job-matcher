import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSearch, Link as LinkIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/FileUpload";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { analyzeJob } from "@/api";
import { cn } from "@/lib/utils";

type InputMode = "description" | "url";

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("description");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    cvFile && (inputMode === "description" ? jobDescription.trim() : jobUrl.trim());

  const handleSubmit = async () => {
    if (!cvFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeJob(cvFile, {
        job_description: inputMode === "description" ? jobDescription : undefined,
        job_url: inputMode === "url" ? jobUrl : undefined,
      });

      navigate("/results", { state: { analysis: result } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze job");
    } finally {
      setIsLoading(false);
    }
  };

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
      </div>
    </div>
  );
}
