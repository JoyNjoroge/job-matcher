import { useState, useCallback } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Copy, Download } from "lucide-react";
import { CoverLetterPdfDocument } from "@/components/cv/CVPdfTemplates";
import type { JsonResume, CVTemplate } from "@/types/jsonResume";

const API_BASE = "https://job-matcher-rasg.onrender.com/api";

interface CoverLetterTabProps {
  resume: JsonResume;
  jobDescription: string;
  companyName: string;
  template: CVTemplate;
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
}

export function CoverLetterTab({ resume, jobDescription, companyName, template, coverLetter, onCoverLetterChange }: CoverLetterTabProps) {
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
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
        body: JSON.stringify({ resume, job_description: jobDescription, company_name: companyName, tone }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      onCoverLetterChange(data.cover_letter || "");
      toast({ title: "✨ Cover letter generated", description: "Tailored to the job description and your CV." });
    } catch {
      toast({ title: "Generation failed", description: "Could not generate cover letter.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [resume, jobDescription, companyName, tone, accessToken, onCoverLetterChange]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(coverLetter);
    toast({ title: "Copied!", description: "Cover letter copied to clipboard." });
  }, [coverLetter]);

  const downloadPdf = useCallback(async () => {
    try {
      const blob = await pdf(
        <CoverLetterPdfDocument coverLetter={coverLetter} resume={resume} template={template} companyName={companyName} />
      ).toBlob();
      const userName = resume.basics.name.replace(/\s+/g, "_") || "Cover_Letter";
      const company = companyName.replace(/\s+/g, "_") || "General";
      const fileName = `${userName}_CoverLetter_${company}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded", description: fileName });
    } catch {
      toast({ title: "Download failed", description: "Could not generate PDF.", variant: "destructive" });
    }
  }, [coverLetter, resume, template, companyName]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Controls + Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generate Cover Letter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">Tone</Label>
            <div className="flex gap-2">
              {(["professional", "enthusiastic", "concise"] as const).map((t) => (
                <Button key={t} size="sm" variant={tone === t ? "default" : "outline"} onClick={() => setTone(t)} className="capitalize text-xs">
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

          {coverLetter && (
            <>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={copyToClipboard}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Text
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={downloadPdf}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                </Button>
              </div>
              <Textarea
                value={coverLetter}
                onChange={(e) => onCoverLetterChange(e.target.value)}
                rows={14}
                className="text-sm leading-relaxed"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Right: Live PDF Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cover Letter Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[calc(100vh-340px)] min-h-[500px]">
            {coverLetter ? (
              <PDFViewer width="100%" height="100%" showToolbar={false} className="rounded-b-lg">
                <CoverLetterPdfDocument coverLetter={coverLetter} resume={resume} template={template} companyName={companyName} />
              </PDFViewer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Generate a cover letter to see the styled preview
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
