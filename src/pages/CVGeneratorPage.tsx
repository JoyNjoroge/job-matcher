import { useState, useCallback, useEffect } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Download, Loader2, FileText, Mail, Package } from "lucide-react";
import { CVFormEditor } from "@/components/cv/CVFormEditor";
import { CVPdfDocument, CoverLetterPdfDocument } from "@/components/cv/CVPdfTemplates";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { CoverLetterTab } from "@/components/cv/CoverLetterTab";
import type { JsonResume, CVTemplate } from "@/types/jsonResume";
import { emptyResume } from "@/types/jsonResume";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/api";


export default function CVGeneratorPage() {
  const auth = useAuth();
  const location = useLocation();
  const locationState = location.state as {
    jobDescription?: string;
    companyName?: string;
    aiSuggestions?: { strengths: string[]; gaps: string[]; red_flags: string[]; fit_score: number };
  } | null;

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const [resume, setResume] = useState<JsonResume>(emptyResume);
  const [template, setTemplate] = useState<CVTemplate>("ats-crusher");
  const [jobDescription, setJobDescription] = useState(locationState?.jobDescription || "");
  const [companyName, setCompanyName] = useState(locationState?.companyName || "");
  const [aiSuggestions] = useState(locationState?.aiSuggestions || null);
  const [isRefining, setIsRefining] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("cv");
  const [coverLetter, setCoverLetter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  // If we arrived from ResultsPage with a JD, auto-trigger profile load so
  // the user sees their data pre-populated ready to refine
  useEffect(() => {
    if (locationState?.jobDescription && accessToken) {
      loadFromProfile();
    }
    // clear location state so refresh doesn't re-trigger
    window.history.replaceState({}, document.title);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from existing profile resume
  const loadFromProfile = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      const profile = data.profile || {};
      const resumeData = data.resume?.parsed_json || {};

      const mapped: JsonResume = {
        basics: {
          name: profile.full_name || "",
          label: profile.desired_job_title || resumeData.seniority_estimation || "",
          email: profile.email || "",
          phone: profile.phone || "",
          url: profile.linkedin_url || "",
          summary: profile.bio || "",
          location: { city: profile.location || "", region: "", countryCode: "" },
        },
        work: (resumeData.experience || []).map((exp: any) => ({
          name: exp.company || "",
          position: exp.title || exp.role || "",
          startDate: exp.start_date || "",
          endDate: exp.end_date || "Present",
          summary: exp.description || "",
          highlights: exp.highlights || exp.achievements || [],
        })),
        education: (resumeData.education || []).map((ed: any) => ({
          institution: ed.institution || ed.school || "",
          area: ed.field || ed.area || "",
          studyType: ed.degree || "",
          startDate: ed.start_date || "",
          endDate: ed.end_date || "",
        })),
        skills: (resumeData.skills || []).map((s: any) =>
          typeof s === "string"
            ? { name: "Skills", keywords: [s] }
            : { name: s.category || s.name || "Skills", keywords: s.items || s.keywords || [] }
        ),
        projects: (resumeData.projects || []).map((p: any) => ({
          name: p.name || "",
          description: p.description || "",
          highlights: p.highlights || [],
        })),
        certifications: (resumeData.certifications || []).map((c: any) =>
          typeof c === "string"
            ? { name: c, issuer: "", date: "" }
            : { name: c.name || "", issuer: c.issuer || "", date: c.date || "" }
        ),
      };

      const stringSkills = mapped.skills.filter((s) => s.name === "Skills");
      const namedSkills = mapped.skills.filter((s) => s.name !== "Skills");
      if (stringSkills.length > 0) {
        const allKeywords = stringSkills.flatMap((s) => s.keywords);
        namedSkills.unshift({ name: "General", keywords: allKeywords });
      }
      mapped.skills = namedSkills.length > 0 ? namedSkills : mapped.skills;

      setResume(mapped);
      toast({ title: "Profile loaded", description: "Your resume data has been imported into the editor." });
    } catch (err) {
      toast({ title: "Error", description: "Could not load profile data.", variant: "destructive" });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [accessToken]);

  // Auto-refine with AI provider
  const autoRefine = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Job description required", description: "Paste a job description so AI provider can tailor your CV.", variant: "destructive" });
      return;
    }
    setIsRefining(true);
    try {
      const res = await fetch(`${API_BASE}/cv/refine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ current_cv: resume, job_description: jobDescription, company_name: companyName }),
      });
      if (!res.ok) throw new Error("AI provider refinement failed");
      const data = await res.json();
      if (data.refined_cv) setResume(data.refined_cv);
      if (data.changelog?.length > 0) {
        toast({ title: "✨ AI provider refined your CV", description: data.changelog.join(". ") });
      } else {
        toast({ title: "✨ CV refined", description: "Your CV has been optimized for this role." });
      }
    } catch {
      toast({ title: "Refinement failed", description: "Could not connect to AI provider. Check your backend.", variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  }, [resume, jobDescription, companyName, accessToken]);

  // Download CV PDF
  const downloadPdf = useCallback(async () => {
    try {
      const blob = await pdf(<CVPdfDocument resume={resume} template={template} />).toBlob();
      const userName = resume.basics.name.replace(/\s+/g, "_") || "Resume";
      const company = companyName.replace(/\s+/g, "_") || "General";
      const fileName = `${userName}_Resume_${company}.pdf`;
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
  }, [resume, template, companyName]);

  // Download bundle (CV + Cover Letter)
  const downloadBundle = useCallback(async () => {
    const userName = resume.basics.name.replace(/\s+/g, "_") || "Applicant";
    const company = companyName.replace(/\s+/g, "_") || "General";
    try {
      const cvBlob = await pdf(<CVPdfDocument resume={resume} template={template} />).toBlob();
      const cvUrl = URL.createObjectURL(cvBlob);
      const cvLink = document.createElement("a");
      cvLink.href = cvUrl;
      cvLink.download = `${userName}_Resume_${company}.pdf`;
      cvLink.click();
      URL.revokeObjectURL(cvUrl);

      if (coverLetter) {
        await new Promise((r) => setTimeout(r, 500));
        const clBlob = await pdf(
          <CoverLetterPdfDocument coverLetter={coverLetter} resume={resume} template={template} companyName={companyName} />
        ).toBlob();
        const clUrl = URL.createObjectURL(clBlob);
        const clLink = document.createElement("a");
        clLink.href = clUrl;
        clLink.download = `${userName}_CoverLetter_${company}.pdf`;
        clLink.click();
        URL.revokeObjectURL(clUrl);
      }
      toast({ title: "Bundle downloaded", description: coverLetter ? "CV + Cover Letter exported." : "CV exported (no cover letter generated yet)." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate PDFs.", variant: "destructive" });
    }
  }, [resume, template, companyName, coverLetter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Smart CV Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build, tailor, and export a job-winning resume & cover letter with AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFromProfile} disabled={isLoadingProfile}>
            {isLoadingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Import from Profile
          </Button>
          {activeTab === "cv" && (
            <Button onClick={downloadPdf}>
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          )}
          <Button variant="secondary" onClick={downloadBundle}>
            <Package className="h-4 w-4 mr-1" /> Download Bundle
          </Button>
        </div>
      </div>

      {/* AI Suggestions Banner — shown when arriving from ResultsPage */}
      {aiSuggestions && showSuggestions && (
        <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4" /> AI Analysis Suggestions (Fit Score: {aiSuggestions.fit_score}%)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {aiSuggestions.gaps.length > 0 && (
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Gaps to address in your CV:</p>
                      <ul className="space-y-0.5 text-amber-800 dark:text-amber-300">
                        {aiSuggestions.gaps.map((g, i) => <li key={i} className="flex gap-1">• {g}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiSuggestions.strengths.length > 0 && (
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Strengths to highlight:</p>
                      <ul className="space-y-0.5 text-emerald-800 dark:text-emerald-300">
                        {aiSuggestions.strengths.map((s, i) => <li key={i} className="flex gap-1">✓ {s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
                  Hit <strong>Auto-Refine</strong> below to apply these improvements to your CV automatically.
                </p>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-violet-400 hover:text-violet-600 text-lg leading-none flex-shrink-0">×</button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Refine Section (shared context for both tabs) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-semibold text-primary">Target Job Description</Label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for AI-powered CV tailoring & cover letter generation..."
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="w-48 space-y-1">
              <Label className="text-xs font-semibold text-primary">Company</Label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
              />
              {activeTab === "cv" && (
                <Button onClick={autoRefine} disabled={isRefining} className="w-full mt-2 bg-primary hover:bg-primary/90">
                  {isRefining ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Auto-Refine
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: CV | Cover Letter */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cv" className="gap-1.5">
            <FileText className="h-4 w-4" /> Resume
          </TabsTrigger>
          <TabsTrigger value="cover-letter" className="gap-1.5">
            <Mail className="h-4 w-4" /> Cover Letter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cv" className="space-y-6 mt-4">
          <TemplateGallery selected={template} onSelect={setTemplate} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Edit Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <CVFormEditor resume={resume} onChange={setResume} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[calc(100vh-340px)] min-h-[500px]">
                  <PDFViewer width="100%" height="100%" showToolbar={false} className="rounded-b-lg">
                    <CVPdfDocument resume={resume} template={template} />
                  </PDFViewer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cover-letter" className="mt-4">
          <CoverLetterTab
            resume={resume}
            jobDescription={jobDescription}
            companyName={companyName}
            template={template}
            coverLetter={coverLetter}
            onCoverLetterChange={setCoverLetter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
