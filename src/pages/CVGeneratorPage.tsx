import { useCallback, useEffect, useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Check, Download, FileText, Files, Loader2, Mail, Package, Sparkles,
} from "lucide-react";
import { CVFormEditor } from "@/components/cv/CVFormEditor";
import { CVPdfDocument, CoverLetterPdfDocument } from "@/components/cv/CVPdfTemplates";
import { TemplateGallery } from "@/components/cv/TemplateGallery";
import { CoverLetterTab } from "@/components/cv/CoverLetterTab";
import { PdfPreviewBoundary } from "@/components/cv/PdfPreviewBoundary";
import type { JsonResume, CVTemplate } from "@/types/jsonResume";
import { emptyResume } from "@/types/jsonResume";
import { mergeRefinedJsonResume, normalizeJsonResume } from "@/lib/normalizeJsonResume";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/api";

type GenerationKind = "resume" | "cover-letter" | "both";

interface GeneratorContext {
  jobDescription?: string;
  companyName?: string;
  jobTitle?: string;
  aiSuggestions?: {
    strengths: string[];
    gaps: string[];
    red_flags: string[];
    fit_score: number;
  };
}

const GENERATOR_CONTEXT_KEY = "candorapply_generator_context";

function readStoredContext(): GeneratorContext | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(GENERATOR_CONTEXT_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function firstPopulatedArray(...values: unknown[]): any[] {
  return values.find((value) => Array.isArray(value) && value.length > 0) as any[] || [];
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => ({}));
  return new Error(payload?.error || fallback);
}

const GENERATION_OPTIONS: {
  id: GenerationKind;
  title: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    id: "resume",
    title: "Tailored resume",
    description: "Optimize your resume for this role.",
    icon: FileText,
  },
  {
    id: "cover-letter",
    title: "Cover letter",
    description: "Write a role-specific cover letter.",
    icon: Mail,
  },
  {
    id: "both",
    title: "Both documents",
    description: "Generate a matching application bundle.",
    icon: Files,
  },
];

export default function CVGeneratorPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigationContext = location.state as GeneratorContext | null;
  const initialContext = navigationContext || readStoredContext();

  const accessToken = typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;

  const [resume, setResume] = useState<JsonResume>(() => normalizeJsonResume(emptyResume));
  const [template, setTemplate] = useState<CVTemplate>("ats-crusher");
  const [generationKind, setGenerationKind] = useState<GenerationKind>("both");
  const [jobDescription, setJobDescription] = useState(initialContext?.jobDescription || "");
  const [companyName, setCompanyName] = useState(initialContext?.companyName || "");
  const [jobTitle] = useState(initialContext?.jobTitle || "");
  const [aiSuggestions] = useState(initialContext?.aiSuggestions || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<"cv" | "cover-letter">("cv");
  const [coverLetter, setCoverLetter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    sessionStorage.setItem(GENERATOR_CONTEXT_KEY, JSON.stringify({
      jobDescription,
      companyName,
      jobTitle,
      aiSuggestions,
    }));
  }, [jobDescription, companyName, jobTitle, aiSuggestions]);

  const loadFromProfile = useCallback(async (showSuccessToast = true): Promise<JsonResume | null> => {
    if (!accessToken) {
      if (showSuccessToast) {
        toast({ title: "Sign in required", description: "Sign in before importing your profile.", variant: "destructive" });
      }
      return null;
    }

    setIsLoadingProfile(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [profileRes, resumeRes] = await Promise.all([
        fetch(`${API_BASE}/profile`, { headers }),
        fetch(`${API_BASE}/resumes/primary`, { headers }),
      ]);
      if (!profileRes.ok) throw await responseError(profileRes, "Failed to load profile");
      if (!resumeRes.ok) throw await responseError(resumeRes, "Failed to load primary resume");

      const [profilePayload, resumePayload] = await Promise.all([
        profileRes.json(),
        resumeRes.json(),
      ]);
      const profile = profilePayload.profile || {};
      const parsed = resumePayload.resume?.parsed_json || {};

      const mapped = normalizeJsonResume({
        basics: {
          name: profile.full_name || parsed.full_name,
          label: profile.job_titles?.[0] || parsed.job_titles?.[0] || parsed.seniority_estimation,
          email: user?.email || parsed.email,
          phone: profile.phone || parsed.phone,
          summary: profile.summary || parsed.summary,
          linkedin: profile.linkedin_url || parsed.linkedin_url,
          github: profile.github_url || parsed.github_url,
          website: profile.portfolio_url || parsed.portfolio_url,
          location: { city: profile.location || parsed.location },
        },
        work: firstPopulatedArray(parsed.experience, parsed.work_experience, profile.work_experience),
        education: firstPopulatedArray(parsed.education, profile.education),
        skills: firstPopulatedArray(parsed.skills, profile.skills),
        projects: firstPopulatedArray(parsed.projects, profile.projects),
        certifications: firstPopulatedArray(parsed.certifications, profile.certifications),
        languages: firstPopulatedArray(parsed.languages, profile.languages),
        awards: firstPopulatedArray(parsed.awards, profile.awards),
      });

      setResume(mapped);
      if (showSuccessToast) {
        toast({
          title: "Profile loaded",
          description: "Your saved resume and profile are ready to tailor.",
        });
      }
      return mapped;
    } catch (error) {
      if (showSuccessToast) {
        toast({
          title: "Could not load profile",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
      }
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [accessToken, user?.email]);

  // Prepare the saved profile in the background when entering from Results.
  useEffect(() => {
    if (accessToken) void loadFromProfile(false);
  }, [accessToken, loadFromProfile]);

  const refineResume = useCallback(async (currentResume: JsonResume): Promise<JsonResume> => {
    const response = await fetch(`${API_BASE}/cv/refine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        current_cv: currentResume,
        job_description: jobDescription,
        company_name: companyName,
      }),
    });
    if (!response.ok) throw await responseError(response, "Resume generation failed");
    const payload = await response.json();
    return mergeRefinedJsonResume(currentResume, payload.refined_cv || currentResume);
  }, [accessToken, companyName, jobDescription]);

  const generateCoverLetter = useCallback(async (currentResume: JsonResume): Promise<string> => {
    const response = await fetch(`${API_BASE}/cv/cover-letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        resume: currentResume,
        job_description: jobDescription,
        company_name: companyName,
        tone: "professional",
      }),
    });
    if (!response.ok) throw await responseError(response, "Cover-letter generation failed");
    const payload = await response.json();
    return String(payload.cover_letter || "").trim();
  }, [accessToken, companyName, jobDescription]);

  const generateDocuments = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description missing",
        description: "Return to the analysis or paste the target job description here.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const profileResume = await loadFromProfile(false);
      if (!profileResume?.basics.name) {
        throw new Error("Your saved profile or resume is empty. Add it on the Profile page first.");
      }

      let generatedResume = profileResume;
      if (generationKind === "resume" || generationKind === "both") {
        generatedResume = await refineResume(profileResume);
        setResume(generatedResume);
      }

      if (generationKind === "cover-letter" || generationKind === "both") {
        const generatedLetter = await generateCoverLetter(generatedResume);
        if (!generatedLetter) throw new Error("The AI provider returned an empty cover letter.");
        setCoverLetter(generatedLetter);
      }

      setActiveTab(generationKind === "cover-letter" ? "cover-letter" : "cv");
      setHasGenerated(true);
      toast({
        title: "Documents ready",
        description: "Review and edit every field before downloading.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generateCoverLetter, generationKind, jobDescription, loadFromProfile, refineResume]);

  const chooseGenerationKind = (kind: GenerationKind) => {
    setGenerationKind(kind);
    setHasGenerated(false);
  };

  const downloadPdf = useCallback(async () => {
    try {
      const blob = await pdf(<CVPdfDocument resume={resume} template={template} />).toBlob();
      const userName = resume.basics.name.replace(/\s+/g, "_") || "Resume";
      const company = companyName.replace(/\s+/g, "_") || "General";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${userName}_Resume_${company}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast({ title: "Download failed", description: "Could not generate the PDF.", variant: "destructive" });
    }
  }, [companyName, resume, template]);

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
      window.setTimeout(() => URL.revokeObjectURL(cvUrl), 1000);

      if (coverLetter) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        const letterBlob = await pdf(
          <CoverLetterPdfDocument
            coverLetter={coverLetter}
            resume={resume}
            template={template}
            companyName={companyName}
          />,
        ).toBlob();
        const letterUrl = URL.createObjectURL(letterBlob);
        const letterLink = document.createElement("a");
        letterLink.href = letterUrl;
        letterLink.download = `${userName}_CoverLetter_${company}.pdf`;
        letterLink.click();
        window.setTimeout(() => URL.revokeObjectURL(letterUrl), 1000);
      }
    } catch {
      toast({ title: "Download failed", description: "Could not generate the bundle.", variant: "destructive" });
    }
  }, [companyName, coverLetter, resume, template]);

  const includesResume = generationKind === "resume" || generationKind === "both";
  const includesCoverLetter = generationKind === "cover-letter" || generationKind === "both";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Application Document Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choose what to create, select a theme, then edit the generated fields.
          </p>
        </div>
        {hasGenerated && (
          <div className="flex gap-2">
            {includesResume && generationKind !== "both" && (
              <Button onClick={downloadPdf}>
                <Download className="h-4 w-4 mr-1" /> Download Resume
              </Button>
            )}
            {generationKind === "both" && (
              <Button onClick={downloadBundle}>
                <Package className="h-4 w-4 mr-1" /> Download Bundle
              </Button>
            )}
          </div>
        )}
      </div>

      {aiSuggestions && showSuggestions && (
        <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4" />
                  Analysis context · {aiSuggestions.fit_score}% fit
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {!!aiSuggestions.gaps?.length && (
                    <div>
                      <p className="font-semibold text-amber-700 mb-1">Gaps to address</p>
                      {aiSuggestions.gaps.map((gap, index) => <p key={index}>• {gap}</p>)}
                    </div>
                  )}
                  {!!aiSuggestions.strengths?.length && (
                    <div>
                      <p className="font-semibold text-emerald-700 mb-1">Strengths to highlight</p>
                      {aiSuggestions.strengths.map((strength, index) => <p key={index}>✓ {strength}</p>)}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-violet-400 hover:text-violet-600 text-lg"
                aria-label="Dismiss suggestions"
              >
                ×
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1. Confirm the target role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
            <div className="space-y-1">
              <Label>Job description</Label>
              <Textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="The job description from your analysis will appear here."
                rows={5}
              />
            </div>
            <div className="space-y-1">
              <Label>Company</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Company name"
              />
              {jobTitle && <p className="text-xs text-muted-foreground pt-2">Role: {jobTitle}</p>}
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => void loadFromProfile(true)}
                disabled={isLoadingProfile}
              >
                {isLoadingProfile && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Reload profile data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2. Choose what to generate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GENERATION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = generationKind === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseGenerationKind(option.id)}
                  className={`relative rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
                  <Icon className="h-5 w-5 text-primary mb-3" />
                  <p className="font-semibold text-sm">{option.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">3. Choose a theme</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateGallery selected={template} onSelect={setTemplate} />
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full h-12"
        onClick={generateDocuments}
        disabled={isGenerating || isLoadingProfile}
      >
        {isGenerating || isLoadingProfile
          ? <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          : <Sparkles className="h-5 w-5 mr-2" />}
        {isGenerating ? "Generating editable documents…" : "Generate editable documents"}
      </Button>

      {hasGenerated && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "cv" | "cover-letter")}>
          <TabsList>
            {includesResume && (
              <TabsTrigger value="cv" className="gap-1.5">
                <FileText className="h-4 w-4" /> Resume
              </TabsTrigger>
            )}
            {includesCoverLetter && (
              <TabsTrigger value="cover-letter" className="gap-1.5">
                <Mail className="h-4 w-4" /> Cover Letter
              </TabsTrigger>
            )}
          </TabsList>

          {includesResume && (
            <TabsContent value="cv" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Edit tailored resume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CVFormEditor resume={resume} onChange={(value) => setResume(normalizeJsonResume(value))} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Live preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[calc(100vh-340px)] min-h-[500px]">
                      <PdfPreviewBoundary>
                        <PDFViewer width="100%" height="100%" showToolbar={false} className="rounded-b-lg">
                          <CVPdfDocument resume={resume} template={template} />
                        </PDFViewer>
                      </PdfPreviewBoundary>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {includesCoverLetter && (
            <TabsContent value="cover-letter" className="mt-4">
              <CoverLetterTab
                resume={resume}
                jobDescription={jobDescription}
                companyName={companyName}
                template={template}
                coverLetter={coverLetter}
                onCoverLetterChange={setCoverLetter}
                allowGenerate={false}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
