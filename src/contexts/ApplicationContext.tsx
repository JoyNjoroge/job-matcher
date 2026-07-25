import React, { createContext, useContext, useState, useEffect } from "react";
import type { Job, AnalysisResult, TrackedApplication } from "@/types";

interface SearchResults {
  jobs: Job[];
  query: string;
  filters: {
    location?: string;
    job_type?: string[];
    experience_level?: string[];
  };
  timestamp: number;
}

interface ApplicationContextType {
  applications: TrackedApplication[];
  setApplications: (apps: TrackedApplication[]) => void;
  addApplication: (job: Job, analysis?: AnalysisResult, cvText?: string) => void;
  updateApplication: (id: string, updates: Partial<TrackedApplication>) => void;
  removeApplication: (id: string) => void;
  toggleSelectedForInterview: (id: string) => void;
  getApplicationById: (id: string) => TrackedApplication | undefined;
  interviewReadyApplications: TrackedApplication[];
  // Search results persistence
  searchResults: SearchResults | null;
  setSearchResults: (results: SearchResults | null) => void;
  clearSearchResults: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

const STORAGE_KEY = "candorapply_applications";
const SEARCH_RESULTS_KEY = "candorapply_search_results";
const LEGACY_STORAGE_KEY = "applybotpro_applications";
const LEGACY_SEARCH_RESULTS_KEY = "applybotpro_search_results";

function migrateLegacyStorage(currentKey: string, legacyKey: string): string | null {
  const current = localStorage.getItem(currentKey);
  if (current) return current;

  const legacy = localStorage.getItem(legacyKey);
  if (legacy) {
    localStorage.setItem(currentKey, legacy);
    localStorage.removeItem(legacyKey);
  }
  return legacy;
}

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplicationsState] = useState<TrackedApplication[]>([]);
  const [searchResults, setSearchResultsState] = useState<SearchResults | null>(null);

  // Load applications from localStorage on mount
  useEffect(() => {
    const stored = migrateLegacyStorage(STORAGE_KEY, LEGACY_STORAGE_KEY);
    if (stored) {
      try {
        setApplicationsState(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored applications:", error);
      }
    }

    // Load search results from localStorage
    const storedSearch = migrateLegacyStorage(
      SEARCH_RESULTS_KEY,
      LEGACY_SEARCH_RESULTS_KEY,
    );
    if (storedSearch) {
      try {
        const parsed = JSON.parse(storedSearch);
        // Only use if less than 30 minutes old
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          setSearchResultsState(parsed);
        } else {
          localStorage.removeItem(SEARCH_RESULTS_KEY);
        }
      } catch (error) {
        console.error("Failed to parse stored search results:", error);
      }
    }
  }, []);

  // Save applications to localStorage whenever they change
  const setApplications = (apps: TrackedApplication[]) => {
    setApplicationsState(apps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  };

  const addApplication = (job: Job, analysis?: AnalysisResult, cvText?: string) => {
    const newApp: TrackedApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      job,
      analysis,
      cvText,
      appliedAt: new Date().toISOString(),
      selectedForInterview: false,
    };
    const newApps = [...applications, newApp];
    setApplications(newApps);
  };

  const updateApplication = (id: string, updates: Partial<TrackedApplication>) => {
    const newApps = applications.map((app) =>
      app.id === id ? { ...app, ...updates } : app
    );
    setApplications(newApps);
  };

  const removeApplication = (id: string) => {
    const newApps = applications.filter((app) => app.id !== id);
    setApplications(newApps);
  };

  const toggleSelectedForInterview = (id: string) => {
    const newApps = applications.map((app) =>
      app.id === id ? { ...app, selectedForInterview: !app.selectedForInterview } : app
    );
    setApplications(newApps);
  };

  const getApplicationById = (id: string) => {
    return applications.find((app) => app.id === id);
  };

  const interviewReadyApplications = applications.filter(
    (app) => app.selectedForInterview
  );

  // Search results management
  const setSearchResults = (results: SearchResults | null) => {
    setSearchResultsState(results);
    if (results) {
      localStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(results));
    } else {
      localStorage.removeItem(SEARCH_RESULTS_KEY);
    }
  };

  const clearSearchResults = () => {
    setSearchResultsState(null);
    localStorage.removeItem(SEARCH_RESULTS_KEY);
  };

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        setApplications,
        addApplication,
        updateApplication,
        removeApplication,
        toggleSelectedForInterview,
        getApplicationById,
        interviewReadyApplications,
        searchResults,
        setSearchResults,
        clearSearchResults,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error("useApplications must be used within ApplicationProvider");
  }
  return context;
}

export type { TrackedApplication };
export default ApplicationContext;
