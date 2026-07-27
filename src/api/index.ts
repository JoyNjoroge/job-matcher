import type {
  AnalysisResult,
  Application,
  InterviewPrepData,
  ExtensionPayload,
  JobSearchParams,
  JobSearchResponse,
  ApplyPrepData,
  SubscriptionResponse,
  Plan,
} from "@/types";

export const API_BASE = (
  import.meta.env.VITE_API_URL || "https://candorapply-backend.joynjoroge.site/api"
).replace(/\/$/, "");

// ─── Auth helper ──────────────────────────────────────────────
function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function getToken(): string {
  return localStorage.getItem("access_token") || "";
}

// ─── Analysis ─────────────────────────────────────────────────
export async function analyzeJob(
  cvFile: File,
  jobData: {
    job_description?: string;
    job_url?: string;
    job_title?: string;
    company?: string;
  }
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("cv", cvFile);
  if (jobData.job_description) formData.append("job_description", jobData.job_description);
  if (jobData.job_url) formData.append("job_url", jobData.job_url);
  if (jobData.job_title) formData.append("job_title", jobData.job_title);
  if (jobData.company) formData.append("company", jobData.company);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to analyze job");
  }

  return response.json();
}

export async function analyzeFromExtension(payload: ExtensionPayload): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/extension/analyze`, {
    method: "POST",
    headers: authHeaders(getToken()),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to analyze from extension");
  }

  return response.json();
}

// ─── Applications ─────────────────────────────────────────────
export async function getApplications(): Promise<Application[]> {
  const response = await fetch(`${API_BASE}/applications`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!response.ok) throw new Error("Failed to fetch applications");
  const payload = await response.json();
  return Array.isArray(payload) ? payload : payload.applications ?? [];
}

// ─── Interview Prep ───────────────────────────────────────────
export async function getInterviewPrep(applicationId: string): Promise<InterviewPrepData> {
  const response = await fetch(`${API_BASE}/interview-prep`, {
    method: "POST",
    headers: authHeaders(getToken()),
    body: JSON.stringify({ application_id: applicationId }),
  });

  if (!response.ok) throw new Error("Failed to fetch interview prep");
  return response.json();
}

// ─── Job Search ───────────────────────────────────────────────
export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append("query", params.query);
  if (params.location) searchParams.append("location", params.location);
  if (params.job_type?.length) params.job_type.forEach(t => searchParams.append("job_type", t));
  if (params.experience_level?.length) params.experience_level.forEach(l => searchParams.append("experience_level", l));

  const response = await fetch(`${API_BASE}/jobs/search?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!response.ok) throw new Error("Failed to search jobs");
  return response.json();
}

// ─── Apply Prep ───────────────────────────────────────────────
export async function prepareApplication(jobId: string): Promise<ApplyPrepData> {
  const response = await fetch(`${API_BASE}/apply/prepare`, {
    method: "POST",
    headers: authHeaders(getToken()),
    body: JSON.stringify({ job_id: jobId }),
  });

  if (!response.ok) throw new Error("Failed to prepare application");
  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────
export async function registerUser(email: string, password: string) {
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
}

export async function loginUser(email: string, password: string) {
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
}

export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("Failed to fetch current user");
  return response.json();
}

export async function refreshTokens(refreshToken: string) {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!response.ok) throw new Error("Failed to refresh tokens");
  return response.json();
}

export async function logoutUser(accessToken: string) {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("Logout failed");
  return response.json();
}

// ─── Profile ──────────────────────────────────────────────────
export async function getProfile(accessToken: string) {
  const response = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateProfile(accessToken: string, profileData: any) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to update profile");
  }

  return response.json();
}

export async function parseResumeForProfile(
  accessToken: string,
  file: File,
  autoApply: boolean = false
) {
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

// ─── Subscription ─────────────────────────────────────────────
export async function getSubscription(accessToken: string): Promise<SubscriptionResponse> {
  const response = await fetch(`${API_BASE}/subscription`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("Failed to fetch subscription");
  return response.json();
}

export async function getPlans(): Promise<{ plans: Plan[] }> {
  const response = await fetch(`${API_BASE}/plans`);
  if (!response.ok) throw new Error("Failed to fetch plans");
  return response.json();
}

export async function cancelSubscription(accessToken: string) {
  const response = await fetch(`${API_BASE}/subscription/cancel`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to cancel subscription");
  }

  return response.json();
}

export async function createSubscriptionCheckout(accessToken: string, planId: string) {
  const response = await fetch(`${API_BASE}/subscription/checkout`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ plan_id: planId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || "Failed to start checkout");
  return payload as { authorization_url?: string; reference?: string };
}

export async function verifySubscriptionPayment(accessToken: string, reference: string) {
  const response = await fetch(
    `${API_BASE}/subscription/verify?reference=${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Payment verification failed");
  }
  return payload;
}
