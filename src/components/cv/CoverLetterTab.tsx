import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Copy, Download } from "lucide-react";
import type { JsonResume } from "@/types/jsonResume";

const API_BASE = "http://localhost:5000/api";

interface CoverLetterTabProps {
  resume: JsonResume;
  jobDescription: string;
  companyName: string;
}

export function CoverLetterTab({ resume, jobDescription, companyName }: CoverLetterTabProps) {
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const [coverLetter, setCoverLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState<"professional" | "enthusiastic" | "concise">("professional");

  const generate = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Job description required", description: "Paste a job description in the field above first.", variant: "destructive" });
      return;
    }
    if (!resume.basics.name) {
      toast({ title: "Resume data required", description: "Fill in your CV or import from profile first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/cv/cover-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          resume,
          job_description: jobDescription,
          company_name: companyName,
          tone,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setCoverLetter(data.cover_letter || "");
      toast({ title: "✨ Cover letter generated", description: "Tailored to the job description and your CV." });
    } catch {
      toast({ title: "Generation failed", description: "Could not generate cover letter.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [resume, jobDescription, companyName, tone, accessToken]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(coverLetter);
    toast({ title: "Copied!", description: "Cover letter copied to clipboard." });
  }, [coverLetter]);

  const downloadTxt = useCallback(() => {
    const userName = resume.basics.name.replace(/\s+/g, "_") || "Cover_Letter";
    const company = companyName.replace(/\s+/g, "_") || "General";
    const fileName = `${userName}_CoverLetter_${company}.txt`;
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: fileName });
  }, [coverLetter, resume.basics.name, companyName]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generate Cover Letter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Tone</Label>
            <div className="flex gap-2">
              {(["professional", "enthusiastic", "concise"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={tone === t ? "default" : "outline"}
                  onClick={() => setTone(t)}
                  className="capitalize text-xs"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground space-y-1">
            <p><strong>Using CV data:</strong> {resume.basics.name || "Not set"}</p>
            <p><strong>Company:</strong> {companyName || "Not set"}</p>
            <p><strong>Job description:</strong> {jobDescription ? `${jobDescription.slice(0, 80)}...` : "Not set"}</p>
          </div>

          <Button onClick={generate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate with AI
          </Button>
        </CardContent>
      </Card>

      {/* Right: Output */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cover Letter</CardTitle>
          {coverLetter && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={downloadTxt}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {coverLetter ? (
            <Textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={20}
              className="text-sm font-serif leading-relaxed"
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
              Click "Generate with AI" to create a tailored cover letter
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
