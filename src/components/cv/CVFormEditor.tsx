import {
  JsonResume, WorkEntry, EducationEntry, SkillEntry,
  ProjectEntry, CertificationEntry, LanguageEntry, AwardEntry, CustomSection
} from "@/types/jsonResume";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";

interface Props { resume: JsonResume; onChange: (r: JsonResume) => void; }

export function CVFormEditor({ resume, onChange }: Props) {

  /* ── Basics ── */
  const setBasic = (k: string, v: string) =>
    onChange({ ...resume, basics: { ...resume.basics, [k]: v } });
  const setLocation = (k: string, v: string) =>
    onChange({ ...resume, basics: { ...resume.basics, location: { ...resume.basics.location, [k]: v } } });

  /* ── Work ── */
  const addWork = () => onChange({ ...resume, work: [...resume.work, { name: "", position: "", startDate: "", endDate: "", summary: "", highlights: [], url: "" }] });
  const setWork = (i: number, k: keyof WorkEntry, v: any) => {
    const w = [...resume.work]; w[i] = { ...w[i], [k]: v }; onChange({ ...resume, work: w });
  };
  const delWork = (i: number) => onChange({ ...resume, work: resume.work.filter((_, x) => x !== i) });

  /* ── Education ── */
  const addEdu = () => onChange({ ...resume, education: [...resume.education, { institution: "", area: "", studyType: "", startDate: "", endDate: "", gpa: "", courses: [] }] });
  const setEdu = (i: number, k: keyof EducationEntry, v: any) => {
    const e = [...resume.education]; e[i] = { ...e[i], [k]: v }; onChange({ ...resume, education: e });
  };
  const delEdu = (i: number) => onChange({ ...resume, education: resume.education.filter((_, x) => x !== i) });

  /* ── Skills ── */
  const addSkill = () => onChange({ ...resume, skills: [...resume.skills, { name: "", keywords: [], level: "" }] });
  const setSkill = (i: number, k: keyof SkillEntry, v: any) => {
    const s = [...resume.skills]; s[i] = { ...s[i], [k]: v }; onChange({ ...resume, skills: s });
  };
  const delSkill = (i: number) => onChange({ ...resume, skills: resume.skills.filter((_, x) => x !== i) });

  /* ── Projects ── */
  const addProject = () => onChange({ ...resume, projects: [...resume.projects, { name: "", description: "", highlights: [], url: "", startDate: "", endDate: "", technologies: [] }] });
  const setProject = (i: number, k: keyof ProjectEntry, v: any) => {
    const p = [...resume.projects]; p[i] = { ...p[i], [k]: v }; onChange({ ...resume, projects: p });
  };
  const delProject = (i: number) => onChange({ ...resume, projects: resume.projects.filter((_, x) => x !== i) });

  /* ── Certifications ── */
  const addCert = () => onChange({ ...resume, certifications: [...resume.certifications, { name: "", issuer: "", date: "", url: "", credentialId: "" }] });
  const setCert = (i: number, k: keyof CertificationEntry, v: string) => {
    const c = [...resume.certifications]; c[i] = { ...c[i], [k]: v }; onChange({ ...resume, certifications: c });
  };
  const delCert = (i: number) => onChange({ ...resume, certifications: resume.certifications.filter((_, x) => x !== i) });

  /* ── Languages ── */
  const addLang = () => onChange({ ...resume, languages: [...resume.languages, { language: "", fluency: "" }] });
  const setLang = (i: number, k: keyof LanguageEntry, v: string) => {
    const l = [...resume.languages]; l[i] = { ...l[i], [k]: v }; onChange({ ...resume, languages: l });
  };
  const delLang = (i: number) => onChange({ ...resume, languages: resume.languages.filter((_, x) => x !== i) });

  /* ── Awards ── */
  const addAward = () => onChange({ ...resume, awards: [...resume.awards, { title: "", awarder: "", date: "", summary: "" }] });
  const setAward = (i: number, k: keyof AwardEntry, v: string) => {
    const a = [...resume.awards]; a[i] = { ...a[i], [k]: v }; onChange({ ...resume, awards: a });
  };
  const delAward = (i: number) => onChange({ ...resume, awards: resume.awards.filter((_, x) => x !== i) });

  /* ── Custom sections ── */
  const addCustomSection = () =>
    onChange({ ...resume, customSections: [...resume.customSections, { title: "Custom Section", entries: [] }] });
  const setCustomTitle = (i: number, v: string) => {
    const cs = [...resume.customSections]; cs[i] = { ...cs[i], title: v }; onChange({ ...resume, customSections: cs });
  };
  const addCustomEntry = (i: number) => {
    const cs = [...resume.customSections];
    cs[i] = { ...cs[i], entries: [...cs[i].entries, { label: "", value: "" }] };
    onChange({ ...resume, customSections: cs });
  };
  const setCustomEntry = (si: number, ei: number, k: "label" | "value", v: string) => {
    const cs = [...resume.customSections];
    const entries = [...cs[si].entries];
    entries[ei] = { ...entries[ei], [k]: v };
    cs[si] = { ...cs[si], entries };
    onChange({ ...resume, customSections: cs });
  };
  const delCustomEntry = (si: number, ei: number) => {
    const cs = [...resume.customSections];
    cs[si] = { ...cs[si], entries: cs[si].entries.filter((_, x) => x !== ei) };
    onChange({ ...resume, customSections: cs });
  };
  const delCustomSection = (i: number) =>
    onChange({ ...resume, customSections: resume.customSections.filter((_, x) => x !== i) });

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
      <Accordion type="multiple" defaultValue={["basics", "work", "education", "skills"]}>

        {/* ── BASICS ── */}
        <AccordionItem value="basics">
          <AccordionTrigger className="text-sm font-semibold">Personal Info</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <F label="Full Name"><Input value={resume.basics.name} onChange={e => setBasic("name", e.target.value)} placeholder="Jane Doe" className="h-9 text-sm" /></F>
              <F label="Job Title"><Input value={resume.basics.label} onChange={e => setBasic("label", e.target.value)} placeholder="Software Engineer" className="h-9 text-sm" /></F>
              <F label="Email"><Input value={resume.basics.email} onChange={e => setBasic("email", e.target.value)} placeholder="jane@example.com" className="h-9 text-sm" /></F>
              <F label="Phone"><Input value={resume.basics.phone} onChange={e => setBasic("phone", e.target.value)} placeholder="+1 555-0100" className="h-9 text-sm" /></F>
              <F label="City"><Input value={resume.basics.location.city} onChange={e => setLocation("city", e.target.value)} className="h-9 text-sm" /></F>
              <F label="Region / Country"><Input value={resume.basics.location.region} onChange={e => setLocation("region", e.target.value)} className="h-9 text-sm" /></F>
              <F label="LinkedIn URL"><Input value={resume.basics.linkedin || ""} onChange={e => setBasic("linkedin", e.target.value)} placeholder="linkedin.com/in/jane" className="h-9 text-sm" /></F>
              <F label="GitHub URL"><Input value={resume.basics.github || ""} onChange={e => setBasic("github", e.target.value)} placeholder="github.com/jane" className="h-9 text-sm" /></F>
              <F label="Website"><Input value={resume.basics.website || ""} onChange={e => setBasic("website", e.target.value)} placeholder="jane.dev" className="h-9 text-sm col-span-2" /></F>
            </div>
            <F label="Professional Summary">
              <Textarea value={resume.basics.summary} onChange={e => setBasic("summary", e.target.value)} rows={3} className="text-sm" placeholder="A brief summary of your professional background..." />
            </F>
          </AccordionContent>
        </AccordionItem>

        {/* ── WORK ── */}
        <AccordionItem value="work">
          <AccordionTrigger className="text-sm font-semibold">Work Experience</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {resume.work.map((w, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Position {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => delWork(i)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Company"><Input value={w.name} onChange={e => setWork(i, "name", e.target.value)} className="h-9 text-sm" /></F>
                    <F label="Position"><Input value={w.position} onChange={e => setWork(i, "position", e.target.value)} className="h-9 text-sm" /></F>
                    <F label="Start Date"><Input value={w.startDate} onChange={e => setWork(i, "startDate", e.target.value)} placeholder="2022-01" className="h-9 text-sm" /></F>
                    <F label="End Date"><Input value={w.endDate} onChange={e => setWork(i, "endDate", e.target.value)} placeholder="Present" className="h-9 text-sm" /></F>
                  </div>
                  <F label="Company URL (optional)"><Input value={w.url || ""} onChange={e => setWork(i, "url", e.target.value)} placeholder="https://company.com" className="h-9 text-sm" /></F>
                  <F label="Summary">
                    <Textarea value={w.summary} onChange={e => setWork(i, "summary", e.target.value)} rows={2} className="text-sm" placeholder="Brief description of your role..." />
                  </F>
                  <F label="Highlights / Achievements (one per line)">
                    <Textarea value={w.highlights.join("\n")} onChange={e => setWork(i, "highlights", e.target.value.split("\n"))} rows={3} className="text-sm" placeholder={"Led a team of 5 engineers\nIncreased revenue by 20%"} />
                  </F>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addWork} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Experience</Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── EDUCATION ── */}
        <AccordionItem value="education">
          <AccordionTrigger className="text-sm font-semibold">Education</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {resume.education.map((ed, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => delEdu(i)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Institution"><Input value={ed.institution} onChange={e => setEdu(i, "institution", e.target.value)} className="h-9 text-sm" /></F>
                    <F label="Degree"><Input value={ed.studyType} onChange={e => setEdu(i, "studyType", e.target.value)} placeholder="B.Sc." className="h-9 text-sm" /></F>
                    <F label="Field of Study"><Input value={ed.area} onChange={e => setEdu(i, "area", e.target.value)} placeholder="Computer Science" className="h-9 text-sm" /></F>
                    <F label="GPA (optional)"><Input value={ed.gpa || ""} onChange={e => setEdu(i, "gpa", e.target.value)} placeholder="3.8" className="h-9 text-sm" /></F>
                    <F label="Start Date"><Input value={ed.startDate} onChange={e => setEdu(i, "startDate", e.target.value)} placeholder="2018" className="h-9 text-sm" /></F>
                    <F label="End Date"><Input value={ed.endDate} onChange={e => setEdu(i, "endDate", e.target.value)} placeholder="2022" className="h-9 text-sm" /></F>
                  </div>
                  <F label="Relevant Courses (comma-separated, optional)">
                    <Input value={(ed.courses || []).join(", ")} onChange={e => setEdu(i, "courses", e.target.value.split(",").map(s => s.trim()))} placeholder="Algorithms, Machine Learning, Databases" className="h-9 text-sm" />
                  </F>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addEdu} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Education</Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── SKILLS ── */}
        <AccordionItem value="skills">
          <AccordionTrigger className="text-sm font-semibold">Skills</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {resume.skills.map((sk, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Input value={sk.name} onChange={e => setSkill(i, "name", e.target.value)} placeholder="Category (e.g. Languages)" className="h-9 text-sm" />
                  <Input value={sk.keywords.join(", ")} onChange={e => setSkill(i, "keywords", e.target.value.split(",").map(s => s.trim()))} placeholder="Python, TypeScript, Go" className="h-9 text-sm" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => delSkill(i)} className="text-destructive h-8 w-8 mt-0.5"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSkill} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Skill Category</Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── PROJECTS ── */}
        <AccordionItem value="projects">
          <AccordionTrigger className="text-sm font-semibold">Projects <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span></AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {resume.projects.map((p, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Project {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => delProject(i)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Project Name"><Input value={p.name} onChange={e => setProject(i, "name", e.target.value)} className="h-9 text-sm" /></F>
                    <F label="URL (optional)"><Input value={p.url || ""} onChange={e => setProject(i, "url", e.target.value)} placeholder="github.com/..." className="h-9 text-sm" /></F>
                    <F label="Start Date (optional)"><Input value={p.startDate || ""} onChange={e => setProject(i, "startDate", e.target.value)} placeholder="2023-06" className="h-9 text-sm" /></F>
                    <F label="End Date (optional)"><Input value={p.endDate || ""} onChange={e => setProject(i, "endDate", e.target.value)} placeholder="2023-12" className="h-9 text-sm" /></F>
                  </div>
                  <F label="Technologies (comma-separated)">
                    <Input value={(p.technologies || []).join(", ")} onChange={e => setProject(i, "technologies", e.target.value.split(",").map(s => s.trim()))} placeholder="React, Node.js, PostgreSQL" className="h-9 text-sm" />
                  </F>
                  <F label="Description">
                    <Textarea value={p.description} onChange={e => setProject(i, "description", e.target.value)} rows={2} className="text-sm" />
                  </F>
                  <F label="Highlights (one per line)">
                    <Textarea value={p.highlights.join("\n")} onChange={e => setProject(i, "highlights", e.target.value.split("\n"))} rows={2} className="text-sm" placeholder={"Reduced load time by 40%\nUsed by 5,000+ users"} />
                  </F>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addProject} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Project</Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── CERTIFICATIONS ── */}
        <AccordionItem value="certifications">
          <AccordionTrigger className="text-sm font-semibold">Certifications <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span></AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {resume.certifications.map((c, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">Cert {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => delCert(i)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Certification Name"><Input value={c.name} onChange={e => setCert(i, "name", e.target.value)} placeholder="AWS Solutions Architect" className="h-9 text-sm" /></F>
                    <F label="Issuer"><Input value={c.issuer} onChange={e => setCert(i, "issuer", e.target.value)} placeholder="Amazon" className="h-9 text-sm" /></F>
                    <F label="Date"><Input value={c.date} onChange={e => setCert(i, "date", e.target.value)} placeholder="2023-08" className="h-9 text-sm" /></F>
                    <F label="Credential ID (optional)"><Input value={c.credentialId || ""} onChange={e => setCert(i, "credentialId", e.target.value)} className="h-9 text-sm" /></F>
                    <F label="URL (optional)"><Input value={c.url || ""} onChange={e => setCert(i, "url", e.target.value)} placeholder="https://..." className="h-9 text-sm col-span-2" /></F>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addCert} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Certification</Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── LANGUAGES ── */}
        <AccordionItem value="languages">
          <AccordionTrigger className="text-sm font-semibold">Languages <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span></AccordionTrigger>
          <AccordionContent className="space-y-2 pt-2">
            {resume.languages.map((l, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={l.language} onChange={e => setLang(i, "language", e.target.value)} placeholder="English" className="h-9 text-sm" />
                <Input value={l.fluency} onChange={e => setLang(i, "fluency", e.target.value)} placeholder="Native / Fluent / Intermediate" className="h-9 text-sm" />
                <Button variant="ghost" size="icon" onClick={() => delLang(i)} className="text-destructive h-8 w-8 flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLang} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Language</Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── AWARDS ── */}
        <AccordionItem value="awards">
          <AccordionTrigger className="text-sm font-semibold">Awards & Honours <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span></AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {resume.awards.map((a, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Award {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => delAward(i)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Title"><Input value={a.title} onChange={e => setAward(i, "title", e.target.value)} placeholder="Best Paper Award" className="h-9 text-sm" /></F>
                    <F label="Awarder"><Input value={a.awarder} onChange={e => setAward(i, "awarder", e.target.value)} placeholder="IEEE" className="h-9 text-sm" /></F>
                    <F label="Date"><Input value={a.date} onChange={e => setAward(i, "date", e.target.value)} placeholder="2023" className="h-9 text-sm" /></F>
                  </div>
                  <F label="Summary (optional)">
                    <Textarea value={a.summary || ""} onChange={e => setAward(i, "summary", e.target.value)} rows={2} className="text-sm" />
                  </F>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addAward} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Award</Button>
          </AccordionContent>
        </AccordionItem>

        {/* ── CUSTOM SECTIONS ── */}
        <AccordionItem value="custom">
          <AccordionTrigger className="text-sm font-semibold">
            Custom Sections <span className="ml-1 text-xs font-normal text-muted-foreground">(add anything — volunteer work, publications, etc.)</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {resume.customSections.map((cs, si) => (
              <Card key={si} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4 space-y-3">
                  <div className="flex gap-2 items-center mb-1">
                    <Input value={cs.title} onChange={e => setCustomTitle(si, e.target.value)} placeholder="Section name (e.g. Volunteer Work)" className="h-9 text-sm font-semibold flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => delCustomSection(si)} className="text-destructive h-8 w-8 flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  {cs.entries.map((entry, ei) => (
                    <div key={ei} className="flex gap-2 items-center">
                      <Input value={entry.label} onChange={e => setCustomEntry(si, ei, "label", e.target.value)} placeholder="Label" className="h-9 text-sm w-36" />
                      <Input value={entry.value} onChange={e => setCustomEntry(si, ei, "value", e.target.value)} placeholder="Value / description" className="h-9 text-sm flex-1" />
                      <Button variant="ghost" size="icon" onClick={() => delCustomEntry(si, ei)} className="text-destructive h-8 w-8 flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addCustomEntry(si)} className="w-full text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> Add Row</Button>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addCustomSection} className="w-full"><Plus className="h-4 w-4 mr-1" /> Add Custom Section</Button>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
