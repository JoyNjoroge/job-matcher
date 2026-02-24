// JSON Resume Schema types for CV Generator
export interface JsonResume {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    url: string;
    summary: string;
    location: {
      city: string;
      region: string;
      countryCode: string;
    };
  };
  work: WorkEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
}

export interface WorkEntry {
  name: string;
  position: string;
  startDate: string;
  endDate: string;
  summary: string;
  highlights: string[];
}

export interface EducationEntry {
  institution: string;
  area: string;
  studyType: string;
  startDate: string;
  endDate: string;
}

export interface SkillEntry {
  name: string;
  keywords: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  highlights: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
}

export const emptyResume: JsonResume = {
  basics: {
    name: "",
    label: "",
    email: "",
    phone: "",
    url: "",
    summary: "",
    location: { city: "", region: "", countryCode: "" },
  },
  work: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
};

export type CVTemplate = "ats-crusher" | "startup" | "executive";
