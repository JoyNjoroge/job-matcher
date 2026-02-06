import React, { createContext, useContext, useState, useEffect } from "react";
import type { Application } from "@/types";

interface SearchResults {
  jobs: any[];
  query: string;
  filters: any;
  timestamp: number;
}

interface ApplicationContextType {
  applications: Application[];
  setApplications: (apps: Application[]) => void;
  addApplication: (app: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  // Search results persistence
  searchResults: SearchResults | null;
  setSearchResults: (results: SearchResults | null) => void;
  clearSearchResults: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

const STORAGE_KEY = "applybotpro_applications";
const SEARCH_RESULTS_KEY = "applybotpro_search_results";

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplicationsState] = useState<Application[]>([]);
  const [searchResults, setSearchResultsState] = useState<SearchResults | null>(null);

  // Load applications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setApplicationsState(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored applications:", error);
      }
    }

    // Load search results from localStorage
    const storedSearch = localStorage.getItem(SEARCH_RESULTS_KEY);
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
  const setApplications = (apps: Application[]) => {
    setApplicationsState(apps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  };

  const addApplication = (app: Application) => {
    const newApps = [...applications, app];
    setApplications(newApps);
  };

  const updateApplication = (id: string, updates: Partial<Application>) => {
    const newApps = applications.map((app) =>
      app.id === id ? { ...app, ...updates } : app
    );
    setApplications(newApps);
  };

  const deleteApplication = (id: string) => {
    const newApps = applications.filter((app) => app.id !== id);
    setApplications(newApps);
  };

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
        deleteApplication,
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

export default ApplicationContext;