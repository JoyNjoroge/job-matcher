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
