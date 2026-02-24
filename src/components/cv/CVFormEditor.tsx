import { JsonResume, WorkEntry, EducationEntry, SkillEntry } from "@/types/jsonResume";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";

interface CVFormEditorProps {
  resume: JsonResume;
  onChange: (resume: JsonResume) => void;
}

export function CVFormEditor({ resume, onChange }: CVFormEditorProps) {
  const updateBasics = (field: string, value: string) => {
    onChange({ ...resume, basics: { ...resume.basics, [field]: value } });
  };

  const updateLocation = (field: string, value: string) => {
    onChange({
      ...resume,
      basics: { ...resume.basics, location: { ...resume.basics.location, [field]: value } },
    });
  };

  const addWork = () => {
    onChange({
      ...resume,
      work: [...resume.work, { name: "", position: "", startDate: "", endDate: "", summary: "", highlights: [] }],
    });
  };

  const updateWork = (i: number, field: keyof WorkEntry, value: any) => {
    const work = [...resume.work];
    work[i] = { ...work[i], [field]: value };
    onChange({ ...resume, work });
  };

  const removeWork = (i: number) => {
    onChange({ ...resume, work: resume.work.filter((_, idx) => idx !== i) });
  };

  const addEducation = () => {
    onChange({
      ...resume,
      education: [...resume.education, { institution: "", area: "", studyType: "", startDate: "", endDate: "" }],
    });
  };

  const updateEducation = (i: number, field: keyof EducationEntry, value: string) => {
    const education = [...resume.education];
    education[i] = { ...education[i], [field]: value };
    onChange({ ...resume, education });
  };

  const removeEducation = (i: number) => {
    onChange({ ...resume, education: resume.education.filter((_, idx) => idx !== i) });
  };

  const addSkill = () => {
    onChange({ ...resume, skills: [...resume.skills, { name: "", keywords: [] }] });
  };

  const updateSkill = (i: number, field: keyof SkillEntry, value: any) => {
    const skills = [...resume.skills];
    skills[i] = { ...skills[i], [field]: value };
    onChange({ ...resume, skills });
  };

  const removeSkill = (i: number) => {
    onChange({ ...resume, skills: resume.skills.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
      <Accordion type="multiple" defaultValue={["basics", "work", "education", "skills"]}>
        {/* Basics */}
        <AccordionItem value="basics">
          <AccordionTrigger className="text-sm font-semibold">Personal Info</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={resume.basics.name} onChange={(e) => updateBasics("name", e.target.value)} placeholder="John Doe" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input value={resume.basics.label} onChange={(e) => updateBasics("label", e.target.value)} placeholder="Software Engineer" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={resume.basics.email} onChange={(e) => updateBasics("email", e.target.value)} placeholder="john@example.com" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={resume.basics.phone} onChange={(e) => updateBasics("phone", e.target.value)} placeholder="+1 555-0100" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">City</Label>
                <Input value={resume.basics.location.city} onChange={(e) => updateLocation("city", e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Region / Country</Label>
                <Input value={resume.basics.location.region} onChange={(e) => updateLocation("region", e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">Professional Summary</Label>
              <Textarea value={resume.basics.summary} onChange={(e) => updateBasics("summary", e.target.value)} rows={3} className="text-sm" placeholder="A brief summary of your professional background..." />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Work */}
        <AccordionItem value="work">
          <AccordionTrigger className="text-sm font-semibold">Work Experience</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {resume.work.map((w, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="pt-4 pb-3 px-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div>
                          <Label className="text-xs text-muted-foreground">Company</Label>
                          <Input value={w.name} onChange={(e) => updateWork(i, "name", e.target.value)} className="h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Position</Label>
                          <Input value={w.position} onChange={(e) => updateWork(i, "position", e.target.value)} className="h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Start Date</Label>
                          <Input value={w.startDate} onChange={(e) => updateWork(i, "startDate", e.target.value)} placeholder="2022-01" className="h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">End Date</Label>
                          <Input value={w.endDate} onChange={(e) => updateWork(i, "endDate", e.target.value)} placeholder="Present" className="h-9 text-sm" />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeWork(i)} className="text-destructive h-8 w-8 ml-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Summary</Label>
                      <Textarea value={w.summary} onChange={(e) => updateWork(i, "summary", e.target.value)} rows={2} className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Highlights (one per line)</Label>
                      <Textarea
                        value={w.highlights.join("\n")}
                        onChange={(e) => updateWork(i, "highlights", e.target.value.split("\n"))}
                        rows={3}
                        className="text-sm"
                        placeholder="Led a team of 5 engineers&#10;Increased revenue by 20%"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addWork} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Education */}
        <AccordionItem value="education">
          <AccordionTrigger className="text-sm font-semibold">Education</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {resume.education.map((ed, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 border border-border/50 rounded-lg p-3 relative">
                  <Button variant="ghost" size="icon" onClick={() => removeEducation(i)} className="absolute top-1 right-1 text-destructive h-7 w-7">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <div>
                    <Label className="text-xs text-muted-foreground">Institution</Label>
                    <Input value={ed.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Degree</Label>
                    <Input value={ed.studyType} onChange={(e) => updateEducation(i, "studyType", e.target.value)} className="h-9 text-sm" placeholder="B.Sc." />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Field</Label>
                    <Input value={ed.area} onChange={(e) => updateEducation(i, "area", e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Period</Label>
                    <Input value={`${ed.startDate} - ${ed.endDate}`} onChange={(e) => {
                      const [s, en] = e.target.value.split(" - ");
                      updateEducation(i, "startDate", s || "");
                      updateEducation(i, "endDate", en || "");
                    }} className="h-9 text-sm" placeholder="2018 - 2022" />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addEducation} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Education
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Skills */}
        <AccordionItem value="skills">
          <AccordionTrigger className="text-sm font-semibold">Skills</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {resume.skills.map((sk, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input value={sk.name} onChange={(e) => updateSkill(i, "name", e.target.value)} placeholder="Category (e.g. Languages)" className="h-9 text-sm" />
                    <Input
                      value={sk.keywords.join(", ")}
                      onChange={(e) => updateSkill(i, "keywords", e.target.value.split(", ").map(s => s.trim()))}
                      placeholder="Python, TypeScript, Go"
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeSkill(i)} className="text-destructive h-8 w-8">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSkill} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Skill Category
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
