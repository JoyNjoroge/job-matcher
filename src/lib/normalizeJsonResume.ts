import type { JsonResume } from "@/types/jsonResume";
import { emptyResume } from "@/types/jsonResume";

const array = (value: unknown): any[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const stringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(text).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

/**
 * AI responses and older parsed resumes do not always contain every JSON
 * Resume field. Keep one strict boundary before data reaches the editor/PDF.
 */
export function normalizeJsonResume(value: unknown): JsonResume {
  const source = value && typeof value === "object" ? value as Record<string, any> : {};
  const basics = source.basics && typeof source.basics === "object" ? source.basics : {};
  const location = basics.location && typeof basics.location === "object" ? basics.location : {};

  return {
    basics: {
      ...emptyResume.basics,
      name: text(basics.name || source.full_name),
      label: text(basics.label || source.job_title),
      email: text(basics.email || source.email),
      phone: text(basics.phone || source.phone),
      url: text(basics.url),
      summary: text(basics.summary || source.summary),
      linkedin: text(basics.linkedin || source.linkedin_url),
      github: text(basics.github || source.github_url),
      website: text(basics.website || source.portfolio_url),
      location: {
        city: text(location.city || source.location),
        region: text(location.region),
        countryCode: text(location.countryCode || location.country_code),
      },
    },
    work: array(source.work || source.experience || source.work_experience).map((item) => ({
      name: text(item?.name || item?.company),
      position: text(item?.position || item?.title || item?.role),
      startDate: text(item?.startDate || item?.start_date),
      endDate: text(item?.endDate || item?.end_date),
      summary: text(item?.summary || item?.description),
      highlights: stringArray(item?.highlights || item?.achievements),
      url: text(item?.url),
    })),
    education: array(source.education).map((item) => ({
      institution: text(item?.institution || item?.school),
      area: text(item?.area || item?.field),
      studyType: text(item?.studyType || item?.degree),
      startDate: text(item?.startDate || item?.start_date),
      endDate: text(item?.endDate || item?.end_date),
      gpa: text(item?.gpa),
      courses: stringArray(item?.courses),
    })),
    skills: array(source.skills).map((item) =>
      typeof item === "string"
        ? { name: "General", keywords: [item] }
        : {
            name: text(item?.name || item?.category) || "General",
            keywords: stringArray(item?.keywords || item?.items || item?.skills),
            level: text(item?.level),
          }
    ),
    projects: array(source.projects).map((item) => ({
      name: text(item?.name),
      description: text(item?.description),
      highlights: stringArray(item?.highlights),
      url: text(item?.url),
      startDate: text(item?.startDate || item?.start_date),
      endDate: text(item?.endDate || item?.end_date),
      technologies: stringArray(item?.technologies || item?.tools),
    })),
    certifications: array(source.certifications).map((item) =>
      typeof item === "string"
        ? { name: item, issuer: "", date: "" }
        : {
            name: text(item?.name),
            issuer: text(item?.issuer),
            date: text(item?.date),
            url: text(item?.url),
            credentialId: text(item?.credentialId || item?.credential_id),
          }
    ),
    languages: array(source.languages).map((item) =>
      typeof item === "string"
        ? { language: item, fluency: "" }
        : {
            language: text(item?.language || item?.name),
            fluency: text(item?.fluency || item?.level),
          }
    ),
    awards: array(source.awards).map((item) =>
      typeof item === "string"
        ? { title: item, awarder: "", date: "" }
        : {
            title: text(item?.title || item?.name),
            awarder: text(item?.awarder || item?.issuer),
            date: text(item?.date),
            summary: text(item?.summary),
          }
    ),
    customSections: array(source.customSections).map((section) => ({
      title: text(section?.title),
      entries: array(section?.entries).map((entry) => ({
        label: text(entry?.label),
        value: text(entry?.value),
      })),
    })),
  };
}

/**
 * A tailoring response may omit unchanged sections. Preserve the verified
 * profile facts in those cases instead of replacing them with empty values.
 */
export function mergeRefinedJsonResume(
  currentValue: JsonResume,
  refinedValue: unknown,
): JsonResume {
  const current = normalizeJsonResume(currentValue);
  const refined = normalizeJsonResume(refinedValue);

  const keepText = (next: string, previous: string) => next.trim() ? next : previous;
  const keepArray = <T,>(next: T[], previous: T[]) => next.length ? next : previous;

  return {
    basics: {
      ...current.basics,
      ...refined.basics,
      name: keepText(refined.basics.name, current.basics.name),
      label: keepText(refined.basics.label, current.basics.label),
      email: keepText(refined.basics.email, current.basics.email),
      phone: keepText(refined.basics.phone, current.basics.phone),
      url: keepText(refined.basics.url, current.basics.url),
      summary: keepText(refined.basics.summary, current.basics.summary),
      linkedin: keepText(refined.basics.linkedin || "", current.basics.linkedin || ""),
      github: keepText(refined.basics.github || "", current.basics.github || ""),
      website: keepText(refined.basics.website || "", current.basics.website || ""),
      location: {
        city: keepText(refined.basics.location.city, current.basics.location.city),
        region: keepText(refined.basics.location.region, current.basics.location.region),
        countryCode: keepText(
          refined.basics.location.countryCode,
          current.basics.location.countryCode,
        ),
      },
    },
    work: keepArray(refined.work, current.work),
    education: keepArray(refined.education, current.education),
    skills: keepArray(refined.skills, current.skills),
    projects: keepArray(refined.projects, current.projects),
    certifications: keepArray(refined.certifications, current.certifications),
    languages: keepArray(refined.languages, current.languages),
    awards: keepArray(refined.awards, current.awards),
    customSections: keepArray(refined.customSections, current.customSections),
  };
}
