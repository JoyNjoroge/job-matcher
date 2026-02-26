// API Response Types

export interface AnalysisResult {
  fit_score: number;
  interview_likelihood: "low" | "medium" | "high";
  strengths: string[];
  gaps: string[];
  red_flags: string[];
  usage?: UsageSummary;
}

export interface Application {
  id: string;
  job_title: string;
  company: string;
  fit_score: number;
  interview_likelihood: "low" | "medium" | "high";
  analysis?: AnalysisResult;
  created_at: string;
}

export interface InterviewPrepData {
  questions: {
    question: string;
    what_they_test: string;
    talking_points: string[];
  }[];
}

export interface ExtensionPayload {
  job_title: string;
  company: string;
  job_description: string;
}

export type FitCategory = "strong" | "medium" | "low";

// Job Search Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_link: string;
  source?: string;
  job_type?: string;
  experience_level?: string;
  salary_range?: string;
  posted_date?: string;
  application_url?: string;
}

export interface JobSearchParams {
  query: string;
  location?: string;
  job_type?: JobType[];
  experience_level?: ExperienceLevel[];
}

export type JobType = "remote" | "onsite" | "hybrid";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead";

export type APIStatusType = "success" | "error" | "no_api_key" | "timeout" | "rate_limited";

export interface APIStatus {
  source: string;
  status: APIStatusType;
  jobs_count: number;
  error_message?: string;
}

export interface JobSearchSummary {
  successful_sources: number;
  total_sources: number;
  jobs_found: number;
  duplicates_removed?: number;
}

export interface JobSearchResponse {
  jobs: Job[];
  api_status?: APIStatus[];
  summary?: JobSearchSummary;
  total_found?: number;
  results_limit?: number;
  showing?: number;
  has_more?: boolean;
  plan?: PlanId;
}

// Apply Preparation Types
export interface ApplyPrepData {
  draft_email: string;
  resume_suggestions: string[];
  ats_notes: string[];
}

// State for passing job between pages
export interface SelectedJobState {
  job: Job;
  analysis?: AnalysisResult;
}

// Tracked Application Type (for frontend context)
export interface TrackedApplication {
  id: string;
  job: Job;
  analysis?: AnalysisResult;
  cvText?: string;
  appliedAt: string;
  selectedForInterview: boolean;
}

// ─── Subscription & Billing Types ────────────────────────────

export type PlanId = "free" | "seeker" | "pro";

export interface PlanLimits {
  cv_analyses_per_day: number;    // -1 = unlimited
  cover_letters_per_day: number;  // 0 = locked, -1 = unlimited
  job_results_limit: number;
  resumes_limit: number;
  cv_refinement: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  limits: PlanLimits;
  features: string[];
}

export interface Subscription {
  plan_id: PlanId;
  status: "active" | "cancelled" | "past_due";
  period_end?: string;
}

export interface FeatureUsage {
  used: number;
  limit: number;       // -1 = unlimited
  remaining: number;   // -1 = unlimited
  locked: boolean;     // true if feature not on plan
  unlimited: boolean;
}

export interface UsageSummary {
  plan: PlanId;
  features: {
    cv_analysis: FeatureUsage;
    cover_letter: FeatureUsage;
  };
}

export interface SubscriptionResponse {
  subscription: Subscription;
  usage: UsageSummary;
}

// Error response when a feature is locked or limit reached
export interface FeatureBlockedError {
  error: string;
  error_code: "feature_locked" | "daily_limit_reached";
  upgrade_required: boolean;
  current_plan: PlanId;
  used?: number;
  limit?: number;
}