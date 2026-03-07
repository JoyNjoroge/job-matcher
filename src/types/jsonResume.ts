// types/jsonResume.ts

export interface BasicInfo {
  name: string;
  label: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location: { city: string; region: string; countryCode: string };
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface WorkEntry {
  name: string;       // company
  position: string;
  startDate: string;
  endDate: string;
  summary: string;
  highlights: string[];
  url?: string;
}

export interface EducationEntry {
  institution: string;
  area: string;
  studyType: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  courses?: string[];
}

export interface SkillEntry {
  name: string;
  keywords: string[];
  level?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  highlights: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  credentialId?: string;
}

export interface LanguageEntry {
  language: string;
  fluency: string;
}

export interface AwardEntry {
  title: string;
  awarder: string;
  date: string;
  summary?: string;
}

// Completely freeform — user names the section and adds key/value rows
export interface CustomSection {
  title: string;
  entries: { label: string; value: string }[];
}

export interface JsonResume {
  basics: BasicInfo;
  work: WorkEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  awards: AwardEntry[];
  customSections: CustomSection[];
}

export type CVTemplate =
  | "ats-crusher"   // plain, maximally ATS-safe
  | "startup"       // indigo header, modern
  | "executive"     // serif, centred, classic
  | "nova"          // two-column, blue sidebar
  | "minimal-ink"   // ultra-minimal, black/white
  | "bold-creative" // dark header, accent colour pops

export const emptyResume: JsonResume = {
  basics: {
    name: "", label: "", email: "", phone: "", url: "",
    summary: "", linkedin: "", github: "", website: "",
    location: { city: "", region: "", countryCode: "" },
  },
  work: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  customSections: [],
};
