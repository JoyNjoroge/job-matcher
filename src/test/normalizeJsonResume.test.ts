import { describe, expect, it } from "vitest";
import { mergeRefinedJsonResume, normalizeJsonResume } from "@/lib/normalizeJsonResume";

describe("normalizeJsonResume", () => {
  it("turns incomplete AI resume data into an editor-safe resume", () => {
    const resume = normalizeJsonResume({
      basics: { name: "Joy Njoroge" },
      work: [{ company: "Example Co", achievements: "Built pipelines\nReduced errors" }],
      skills: [{ name: "Data", items: "Python, SQL" }],
      projects: [{ name: "Matcher" }],
    });

    expect(resume.basics.location).toEqual({ city: "", region: "", countryCode: "" });
    expect(resume.work[0].highlights).toEqual(["Built pipelines", "Reduced errors"]);
    expect(resume.skills[0].keywords).toEqual(["Python", "SQL"]);
    expect(resume.projects[0].highlights).toEqual([]);
    expect(resume.languages).toEqual([]);
    expect(resume.awards).toEqual([]);
    expect(resume.customSections).toEqual([]);
  });

  it("normalizes plain string skills", () => {
    const resume = normalizeJsonResume({ skills: ["Python", "SQL"] });
    expect(resume.skills).toEqual([
      { name: "General", keywords: ["Python"] },
      { name: "General", keywords: ["SQL"] },
    ]);
  });

  it("preserves verified sections omitted by a tailoring response", () => {
    const current = normalizeJsonResume({
      basics: { name: "Joy Njoroge", email: "joy@example.com" },
      work: [{ company: "Example Co", role: "Analyst" }],
      skills: ["Python"],
    });

    const merged = mergeRefinedJsonResume(current, {
      basics: { summary: "Tailored data professional." },
      skills: [{ name: "Relevant skills", keywords: ["Python", "SQL"] }],
    });

    expect(merged.basics.name).toBe("Joy Njoroge");
    expect(merged.basics.email).toBe("joy@example.com");
    expect(merged.basics.summary).toBe("Tailored data professional.");
    expect(merged.work[0].position).toBe("Analyst");
    expect(merged.skills[0].keywords).toEqual(["Python", "SQL"]);
  });
});
