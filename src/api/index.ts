import type { AnalysisResult, Application, InterviewPrepData, ExtensionPayload } from "@/types";

const API_BASE = "/api";

export async function analyzeJob(
  cvFile: File,
  jobData: { job_description?: string; job_url?: string }
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("cv", cvFile);
  
  if (jobData.job_description) {
    formData.append("job_description", jobData.job_description);
  }
  if (jobData.job_url) {
    formData.append("job_url", jobData.job_url);
  }

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze job");
  }

  return response.json();
}

export async function getApplications(): Promise<Application[]> {
  const response = await fetch(`${API_BASE}/applications`);

  if (!response.ok) {
    throw new Error("Failed to fetch applications");
  }

  return response.json();
}

export async function getInterviewPrep(applicationId: string): Promise<InterviewPrepData> {
  const response = await fetch(`${API_BASE}/interview-prep`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ application_id: applicationId }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch interview prep");
  }

  return response.json();
}

export async function analyzeFromExtension(payload: ExtensionPayload): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/extension/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze from extension");
  }

  return response.json();
}
