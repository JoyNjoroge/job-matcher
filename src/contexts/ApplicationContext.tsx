import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { Job, AnalysisResult, Application } from "@/types";

export interface TrackedApplication {
  id: string;
  job: Job;
  analysis?: AnalysisResult;
  status: "applied" | "interviewing" | "rejected" | "offered";
  selectedForInterview: boolean;
  cvText?: string;
  appliedAt: string;
}

interface ApplicationContextType {
  applications: TrackedApplication[];
  addApplication: (job: Job, analysis?: AnalysisResult, cvText?: string) => void;
  removeApplication: (id: string) => void;
  toggleSelectedForInterview: (id: string) => void;
  updateApplicationStatus: (id: string, status: TrackedApplication["status"]) => void;
  getApplicationById: (id: string) => TrackedApplication | undefined;
  interviewReadyApplications: TrackedApplication[];
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

const STORAGE_KEY = "applybot_applications";

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<TrackedApplication[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const addApplication = useCallback((job: Job, analysis?: AnalysisResult, cvText?: string) => {
    const newApp: TrackedApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      job,
      analysis,
      status: "applied",
      selectedForInterview: false,
      cvText,
      appliedAt: new Date().toISOString(),
    };
    setApplications((prev) => [newApp, ...prev]);
  }, []);

  const removeApplication = useCallback((id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }, []);

  const toggleSelectedForInterview = useCallback((id: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, selectedForInterview: !app.selectedForInterview } : app
      )
    );
  }, []);

  const updateApplicationStatus = useCallback((id: string, status: TrackedApplication["status"]) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
  }, []);

  const getApplicationById = useCallback((id: string) => {
    return applications.find((app) => app.id === id);
  }, [applications]);

  const interviewReadyApplications = applications.filter((app) => app.selectedForInterview);

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        addApplication,
        removeApplication,
        toggleSelectedForInterview,
        updateApplicationStatus,
        getApplicationById,
        interviewReadyApplications,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error("useApplications must be used within ApplicationProvider");
  }
  return context;
}
