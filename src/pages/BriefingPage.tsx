import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Upload, AlertCircle, CheckCircle, Info, ExternalLink, Sparkles, TrendingUp, TrendingDown, Award, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useApplications } from "@/contexts/ApplicationContext";

interface FitAnalysis {
  fit_score: number;
  recommendation: "strong_fit" | "good_fit" | "fair_fit" | "poor_fit";
  strengths: string[];
  gaps: string[];
  skill_recommendations: string[];
  experience_match: string;
  message: string;
  should_apply: boolean;
}

interface JobData {
  id: string;
  title: string;
  company: string;
  application_url?: string;
  apply_link?: string;
  description: string;
  requirements?: string;
  location?: string;
}

export default function ApplyBriefingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { searchResults } = useApplications();
  
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);
  const [resumeStatus, setResumeStatus] = useState<{ has_resume: boolean; resume_source: string } | null>(null);

  const jobId = searchParams.get("job_id");

  useEffect(() => {
    if (!jobId) {
      navigate("/search");
      return;
    }

    fetchJobAndAnalyze();
  }, [jobId]);

  const checkResumeStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/apply/get-resume-status", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResumeStatus(data);
        return data.has_resume;
      }
      return false;
    } catch (err) {
      console.error("Resume status check error:", err);
      return false;
    }
  };

  const fetchJobAndAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find job in searchResults
      let job = searchResults?.jobs?.find((j: any) => j.id === jobId);
      
      if (!job) {
        setError("Job not found. Please search again.");
        setLoading(false);
        return;
      }
      
      setJobData(job);

      // Check if user has a resume
      const hasResume = await checkResumeStatus();
      
      if (!hasResume) {
        setError("No resume found. Please upload a resume to your profile first or upload one below.");
        setLoading(false);
        return;
      }

      // Analyze fit with profile resume
      await analyzeFit(job, null);

    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to load job analysis");
      setLoading(false);
    }
  };

  const analyzeFit = async (job: JobData, customResume?: File | null) => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const formData = new FormData();
      formData.append("job_id", job.id);
      formData.append("job_description", job.description);
      
      if (customResume) {
        formData.append("resume", customResume);
        formData.append("use_profile_resume", "false");
      } else {
        formData.append("use_profile_resume", "true");
      }

      const response = await fetch("http://localhost:5000/api/apply/analyze-fit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || `Analysis failed: ${response.status}`);
      }

      setAnalysis(result);
      setError(null);

    } catch (err: any) {
      console.error("Analysis error:", err);
      const errorMessage = err.message || "Failed to analyze job fit";
      
      // Show helpful error messages
      if (errorMessage.includes("No resume found") || errorMessage.includes("doesn't have enough information")) {
        setError(`${errorMessage} You can upload a resume below or add one to your profile.`);
      } else {
        setError(errorMessage);
      }
      
      // Don't clear analysis if we already have one
      if (!analysis) {
        setAnalysis(null);
      }
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setError("Invalid file type. Please upload a PDF or Word document.");
      return;
    }

    setUploadedResume(file);
    setUseProfileResume(false);
    
    if (jobData) {
      await analyzeFit(jobData, file);
    }
  };

  const handleUseProfileResume = async () => {
    setUploadedResume(null);
    setUseProfileResume(true);
    
    if (jobData) {
      await analyzeFit(jobData, null);
    }
  };

  const handleProceedToApplication = () => {
    if (!jobData) return;

    // Get the application URL (prefer application_url, fallback to apply_link)
    const applicationUrl = jobData.application_url || jobData.apply_link;
    if (!applicationUrl) {
      setError("No application URL available for this job");
      return;
    }

    // Add tracking parameter for extension
    const url = new URL(applicationUrl);
    url.searchParams.set("applybotpro_job_id", jobData.id);
    
    // Open in new tab
    window.open(url.toString(), "_blank");
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "strong_fit":
        return "text-green-600 bg-green-50 border-green-200";
      case "good_fit":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "fair_fit":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "poor_fit":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "strong_fit":
        return <Award className="h-5 w-5" />;
      case "good_fit":
        return <TrendingUp className="h-5 w-5" />;
      case "fair_fit":
        return <Info className="h-5 w-5" />;
      case "poor_fit":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  if (loading && !jobData) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Failed to load job data"}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/search")} className="mt-4">
          Back to Search
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{jobData.title}</h1>
          <p className="text-lg text-muted-foreground mt-1">{jobData.company}</p>
          {jobData.location && (
            <p className="text-sm text-muted-foreground mt-1">{jobData.location}</p>
          )}
        </div>
        <Badge variant="outline" className="text-sm">
          Pre-Application Analysis
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resume Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Choose Resume to Analyze
          </CardTitle>
          <CardDescription>
            {resumeStatus?.has_resume 
              ? `Using resume from ${resumeStatus.resume_source === 'resume_file' ? 'uploaded file' : 'profile data'}`
              : "No resume found - please upload one below"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant={useProfileResume ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={handleUseProfileResume}
              disabled={analyzing || !resumeStatus?.has_resume}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${useProfileResume ? "opacity-100" : "opacity-50"}`} />
                <span className="font-semibold">Use Profile Resume</span>
              </div>
              <span className="text-xs text-left opacity-80">
                {resumeStatus?.has_resume 
                  ? "Use the resume saved in your profile" 
                  : "Upload a resume to your profile first"}
              </span>
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
                disabled={analyzing}
              />
              <label htmlFor="resume-upload">
                <Button
                  variant={!useProfileResume && uploadedResume ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start gap-2 w-full cursor-pointer"
                  asChild
                  disabled={analyzing}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Upload className={`h-5 w-5 ${!useProfileResume && uploadedResume ? "opacity-100" : "opacity-50"}`} />
                      <span className="font-semibold">Upload Different Resume</span>
                    </div>
                    <span className="text-xs text-left opacity-80">
                      {uploadedResume ? uploadedResume.name : "Upload a custom resume for this job"}
                    </span>
                  </div>
                </Button>
              </label>
            </div>
          </div>

          {analyzing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing fit with AI...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && !analyzing && (
        <>
          {/* Fit Score */}
          <Card className={`border-2 ${getRecommendationColor(analysis.recommendation)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRecommendationIcon(analysis.recommendation)}
                  <div>
                    <CardTitle>Fit Analysis</CardTitle>
                    <CardDescription className="mt-1">
                      Based on your resume and the job requirements
                    </CardDescription>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{analysis.fit_score}%</div>
                  <div className="text-xs uppercase font-medium mt-1">
                    {analysis.recommendation.replace("_", " ")}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className={getRecommendationColor(analysis.recommendation)}>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI Recommendation</AlertTitle>
                <AlertDescription className="mt-2">
                  {analysis.message}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Gaps & Recommendations */}
          {(analysis.gaps.length > 0 || analysis.skill_recommendations.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Info className="h-5 w-5" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.gaps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Gaps Identified:</h4>
                    <ul className="space-y-2">
                      {analysis.gaps.map((gap, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.skill_recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Recommendations:</h4>
                    <ul className="space-y-2">
                      {analysis.skill_recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Experience Match */}
          {analysis.experience_match && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Experience Level Match</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.experience_match}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/search")}
            >
              Back to Search
            </Button>

            <div className="flex gap-3">
              {!analysis.should_apply && (
                <Alert className="flex-1 py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    We recommend reconsidering this application
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                size="lg"
                onClick={handleProceedToApplication}
                className="gap-2"
              >
                {analysis.should_apply ? "Proceed to Application" : "Apply Anyway"}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* No analysis yet */}
      {!analysis && !analyzing && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Upload a resume or use your profile resume to get a fit analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}