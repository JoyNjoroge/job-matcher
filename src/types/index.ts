// API Response Types

export interface AnalysisResult {
  fit_score: number;
  interview_likelihood: "low" | "medium" | "high";
  strengths: string[];
  gaps: string[];
  red_flags: string[];
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
