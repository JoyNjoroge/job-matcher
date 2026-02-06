import type { 
  AnalysisResult, 
  Application, 
  InterviewPrepData, 
  ExtensionPayload,
  JobSearchParams,
  JobSearchResponse,
  ApplyPrepData
} from "@/types";

const API_BASE = "http://localhost:5000/api";

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

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append("query", params.query);
  
  if (params.location) {
    searchParams.append("location", params.location);
  }
  if (params.job_type?.length) {
    params.job_type.forEach(type => searchParams.append("job_type", type));
  }
  if (params.experience_level?.length) {
    params.experience_level.forEach(level => searchParams.append("experience_level", level));
  }

  const response = await fetch(`${API_BASE}/jobs/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to search jobs");
  }

  return response.json();
}

export async function prepareApplication(jobId: string): Promise<ApplyPrepData> {
  const response = await fetch(`${API_BASE}/apply/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job_id: jobId }),
  });

  if (!response.ok) {
    throw new Error("Failed to prepare application");
  }

  return response.json();
}

// -------------------- Auth APIs --------------------
export async function registerUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || "Registration failed");
    }

    return response.json();
  } catch (error) {
    console.error("Register fetch error:", error);
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || "Login failed");
    }

    return response.json();
  } catch (error) {
    console.error("Login fetch error:", error);
    throw error;
  }
}

export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}

export async function refreshTokens(refreshToken: string) {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to refresh tokens");
  }

  return response.json();
}

export async function logoutUser(accessToken: string) {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return response.json();
}

// -------------------- Profile APIs --------------------
export async function getProfile(accessToken: string) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  return response.json();
}

export async function updateProfile(accessToken: string, profileData: any) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to update profile");
  }

  return response.json();
}

export async function parseResumeForProfile(accessToken: string, file: File, autoApply: boolean = false) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("auto_apply", autoApply ? "true" : "false");

  const response = await fetch(`${API_BASE}/profile/parse-resume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to parse resume");
  }

  return response.json();
}

export async function parseLinkedInForProfile(accessToken: string, linkedinUrl: string, autoApply: boolean = false) {
  const response = await fetch(`${API_BASE}/profile/parse-linkedin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      linkedin_url: linkedinUrl,
      auto_apply: autoApply,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to parse LinkedIn profile");
  }

  return response.json();
}