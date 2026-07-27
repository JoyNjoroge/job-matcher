import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { JsonResume, CVTemplate } from "@/types/jsonResume";

/* ════════════════════════════════════════════════════════════════
   SHARED SECTION RENDERER
   Each template passes its own style object; this function
   renders all sections (experience, education, skills, projects,
   certifications, languages, awards, custom) using those styles.
   ════════════════════════════════════════════════════════════════ */

function Bullets({ items, s }: { items: string[]; s: any }) {
  const filtered = (items || []).filter(Boolean);
  if (!filtered.length) return null;
  return (
    <>
      {filtered.map((h, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{h}</Text>
        </View>
      ))}
    </>
  );
}

function Sections({ resume, s }: { resume: JsonResume; s: any }) {
  const b = resume.basics;
  return (
    <>
      {/* Summary */}
      {b.summary ? (
        <>
          <Text style={s.sectionTitle}>Summary</Text>
          <Text style={s.summary}>{b.summary}</Text>
        </>
      ) : null}

      {/* Experience */}
      {resume.work.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Experience</Text>
          {resume.work.map((w, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <View style={s.entryHeader}>
                <Text style={s.entryTitle}>{w.position}</Text>
                <Text style={s.entryDate}>{w.startDate}{w.startDate ? " — " : ""}{w.endDate || "Present"}</Text>
              </View>
              <Text style={s.entrySubtitle}>{w.name}{w.url ? ` · ${w.url}` : ""}</Text>
              {w.summary ? <Text style={s.entrySummary}>{w.summary}</Text> : null}
              <Bullets items={w.highlights} s={s} />
            </View>
          ))}
        </>
      )}

      {/* Projects */}
      {resume.projects.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Projects</Text>
          {resume.projects.map((p, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <View style={s.entryHeader}>
                <Text style={s.entryTitle}>{p.name}</Text>
                {(p.startDate || p.endDate) ? (
                  <Text style={s.entryDate}>{p.startDate}{p.endDate ? ` — ${p.endDate}` : ""}</Text>
                ) : null}
              </View>
              {p.technologies?.length ? (
                <Text style={s.entrySubtitle}>{(p.technologies || []).join(", ")}</Text>
              ) : null}
              {p.description ? <Text style={s.entrySummary}>{p.description}</Text> : null}
              <Bullets items={p.highlights} s={s} />
            </View>
          ))}
        </>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Education</Text>
          {resume.education.map((ed, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={s.entryHeader}>
                <Text style={s.entryTitle}>{[ed.studyType, ed.area].filter(Boolean).join(" in ")}</Text>
                <Text style={s.entryDate}>{ed.startDate}{ed.startDate ? " — " : ""}{ed.endDate}</Text>
              </View>
              <Text style={s.entrySubtitle}>{ed.institution}{ed.gpa ? `  ·  GPA: ${ed.gpa}` : ""}</Text>
              {ed.courses?.length ? (
                <Text style={s.entrySummary}>Relevant courses: {(ed.courses || []).join(", ")}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}

      {/* Certifications */}
      {resume.certifications.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Certifications</Text>
          {resume.certifications.map((c, i) => (
            <View key={i} style={s.skillRow}>
              <Text style={s.skillName}>{c.name}</Text>
              <Text style={s.skillKeywords}>
                {c.issuer}{c.date ? ` · ${c.date}` : ""}{c.credentialId ? ` · ID: ${c.credentialId}` : ""}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Skills</Text>
          {resume.skills.map((sk, i) => (
            <View key={i} style={s.skillRow}>
              <Text style={s.skillName}>{sk.name}:</Text>
              <Text style={s.skillKeywords}>{(sk.keywords || []).join(", ")}</Text>
            </View>
          ))}
        </>
      )}

      {/* Languages */}
      {resume.languages.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Languages</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {resume.languages.map((l, i) => (
              <Text key={i} style={s.skillKeywords}>{l.language} ({l.fluency})</Text>
            ))}
          </View>
        </>
      )}

      {/* Awards */}
      {resume.awards.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Awards</Text>
          {resume.awards.map((a, i) => (
            <View key={i} style={{ marginBottom: 5 }}>
              <View style={s.entryHeader}>
                <Text style={s.entryTitle}>{a.title}</Text>
                <Text style={s.entryDate}>{a.date}</Text>
              </View>
              <Text style={s.entrySubtitle}>{a.awarder}</Text>
              {a.summary ? <Text style={s.entrySummary}>{a.summary}</Text> : null}
            </View>
          ))}
        </>
      )}

      {/* Custom sections */}
      {resume.customSections.map((cs, ci) => (
        cs.entries.length > 0 ? (
          <View key={ci}>
            <Text style={s.sectionTitle}>{cs.title || "Custom Section"}</Text>
            {cs.entries.map((entry, ei) => (
              <View key={ei} style={s.skillRow}>
                <Text style={s.skillName}>{entry.label}:</Text>
                <Text style={s.skillKeywords}>{entry.value}</Text>
              </View>
            ))}
          </View>
        ) : null
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   TEMPLATE 1 — ATS CRUSHER
   Plain Helvetica, no colour, single column. Passes every ATS.
   ════════════════════════════════════════════════════════════════ */
const atsS = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  label: { fontSize: 11, color: "#555", marginBottom: 5 },
  contactRow: { flexDirection: "row", gap: 14, fontSize: 9, color: "#555", marginBottom: 14, flexWrap: "wrap" },
  summary: { fontSize: 9.5, lineHeight: 1.55, color: "#333", marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", borderBottomWidth: 1, borderBottomColor: "#bbb", paddingBottom: 2, marginBottom: 6, marginTop: 10 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryDate: { fontSize: 9, color: "#555" },
  entrySubtitle: { fontSize: 9, color: "#555", marginBottom: 3 },
  entrySummary: { fontSize: 9, color: "#444", marginBottom: 3, lineHeight: 1.4 },
  bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 8 },
  bulletDot: { width: 7, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.4, color: "#333" },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillName: { fontFamily: "Helvetica-Bold", fontSize: 9, width: 110 },
  skillKeywords: { flex: 1, fontSize: 9, color: "#444" },
});

function ATSTemplate({ resume }: { resume: JsonResume }) {
  const b = resume.basics;
  return (
    <Document>
      <Page size="A4" style={atsS.page}>
        <Text style={atsS.name}>{b.name || "Your Name"}</Text>
        {b.label ? <Text style={atsS.label}>{b.label}</Text> : null}
        <View style={atsS.contactRow}>
          {b.email ? <Text>{b.email}</Text> : null}
          {b.phone ? <Text>{b.phone}</Text> : null}
          {b.location.city ? <Text>{[b.location.city, b.location.region].filter(Boolean).join(", ")}</Text> : null}
          {b.linkedin ? <Text>{b.linkedin}</Text> : null}
          {b.github ? <Text>{b.github}</Text> : null}
          {b.website ? <Text>{b.website}</Text> : null}
        </View>
        <Sections resume={resume} s={atsS} />
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════════════════════════════
   TEMPLATE 2 — STARTUP
   Indigo full-bleed header, modern sans
   ════════════════════════════════════════════════════════════════ */
const startS = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  header: { backgroundColor: "#4338ca", padding: "20 36 16 36", marginHorizontal: -36, marginTop: -36, marginBottom: 16 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#fff" },
  label: { fontSize: 11, color: "#c7d2fe", marginTop: 2 },
  contactRow: { flexDirection: "row", gap: 12, fontSize: 8.5, color: "#e0e7ff", marginTop: 7, flexWrap: "wrap" },
  summary: { fontSize: 9.5, lineHeight: 1.6, color: "#334155", marginBottom: 4, backgroundColor: "#f1f5f9", padding: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#4338ca", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6, marginTop: 12, borderBottomWidth: 1, borderBottomColor: "#e0e7ff", paddingBottom: 2 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryDate: { fontSize: 8.5, color: "#64748b" },
  entrySubtitle: { fontSize: 8.5, color: "#64748b", marginBottom: 3 },
  entrySummary: { fontSize: 9, color: "#475569", marginBottom: 3, lineHeight: 1.4 },
  bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 8 },
  bulletDot: { width: 8, fontSize: 9, color: "#4338ca" },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.4 },
  skillRow: { flexDirection: "row", marginBottom: 3 },
  skillName: { fontFamily: "Helvetica-Bold", fontSize: 9, width: 110, color: "#4338ca" },
  skillKeywords: { flex: 1, fontSize: 9, color: "#475569" },
});

function StartupTemplate({ resume }: { resume: JsonResume }) {
  const b = resume.basics;
  return (
    <Document>
      <Page size="A4" style={startS.page}>
        <View style={startS.header}>
          <Text style={startS.name}>{b.name || "Your Name"}</Text>
          {b.label ? <Text style={startS.label}>{b.label}</Text> : null}
          <View style={startS.contactRow}>
            {b.email ? <Text>{b.email}</Text> : null}
            {b.phone ? <Text>{b.phone}</Text> : null}
            {b.location.city ? <Text>{[b.location.city, b.location.region].filter(Boolean).join(", ")}</Text> : null}
            {b.linkedin ? <Text>{b.linkedin}</Text> : null}
            {b.github ? <Text>{b.github}</Text> : null}
          </View>
        </View>
        <Sections resume={resume} s={startS} />
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════════════════════════════
   TEMPLATE 3 — EXECUTIVE
   Serif, centred header, classic banking/law style
   ════════════════════════════════════════════════════════════════ */
const execS = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Times-Roman", color: "#1a1a1a" },
  name: { fontSize: 24, fontFamily: "Times-Bold", letterSpacing: 2, textTransform: "uppercase" as const, textAlign: "center" as const },
  label: { fontSize: 11, fontFamily: "Times-Italic", color: "#444", marginTop: 3, textAlign: "center" as const },
  contactRow: { flexDirection: "row", justifyContent: "center", gap: 14, fontSize: 9, color: "#555", marginTop: 7, marginBottom: 14, flexWrap: "wrap" },
  divider: { borderBottomWidth: 2, borderBottomColor: "#1a1a1a", marginBottom: 14 },
  summary: { fontSize: 9.5, lineHeight: 1.65, color: "#333", fontFamily: "Times-Italic", marginBottom: 4, textAlign: "justify" as const },
  sectionTitle: { fontSize: 11, fontFamily: "Times-Bold", textTransform: "uppercase" as const, letterSpacing: 1.5, borderBottomWidth: 1, borderBottomColor: "#999", paddingBottom: 2, marginBottom: 8, marginTop: 12 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  entryTitle: { fontFamily: "Times-Bold", fontSize: 10 },
  entryDate: { fontSize: 9, fontFamily: "Times-Italic", color: "#555" },
  entrySubtitle: { fontSize: 9, fontFamily: "Times-Italic", color: "#555", marginBottom: 3 },
  entrySummary: { fontSize: 9, color: "#444", marginBottom: 3, lineHeight: 1.45 },
  bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 10 },
  bulletDot: { width: 8, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.45 },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillName: { fontFamily: "Times-Bold", fontSize: 9, width: 120 },
  skillKeywords: { flex: 1, fontSize: 9, color: "#444" },
});

function ExecutiveTemplate({ resume }: { resume: JsonResume }) {
  const b = resume.basics;
  return (
    <Document>
      <Page size="A4" style={execS.page}>
        <Text style={execS.name}>{b.name || "Your Name"}</Text>
        {b.label ? <Text style={execS.label}>{b.label}</Text> : null}
        <View style={execS.contactRow}>
          {b.email ? <Text>{b.email}</Text> : null}
          {b.phone ? <Text>{b.phone}</Text> : null}
          {b.location.city ? <Text>{[b.location.city, b.location.region].filter(Boolean).join(", ")}</Text> : null}
          {b.linkedin ? <Text>{b.linkedin}</Text> : null}
        </View>
        <View style={execS.divider} />
        <Sections resume={resume} s={execS} />
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════════════════════════════
   TEMPLATE 4 — NOVA (two-column)
   Blue left sidebar with contact/skills, main column for experience
   ════════════════════════════════════════════════════════════════ */
const novaS = StyleSheet.create({
  page: { flexDirection: "row", fontSize: 9.5, fontFamily: "Helvetica", color: "#1e293b" },
  sidebar: { width: 170, backgroundColor: "#1e3a5f", padding: "36 14 36 18", minHeight: "100%", flexShrink: 0 },
  sidebarName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#fff", marginBottom: 2, lineHeight: 1.2 },
  sidebarLabel: { fontSize: 9.5, color: "#93c5fd", marginBottom: 14 },
  sidebarSection: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#93c5fd", textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 5, marginTop: 12 },
  sidebarText: { fontSize: 8.5, color: "#cbd5e1", marginBottom: 3, lineHeight: 1.4 },
  sidebarSkillName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#e2e8f0", marginBottom: 1 },
  sidebarSkillBar: { height: 3, backgroundColor: "#334155", borderRadius: 2, marginBottom: 5 },
  sidebarSkillFill: { height: 3, backgroundColor: "#3b82f6", borderRadius: 2 },
  main: { flex: 1, padding: "36 30 36 22" },
  summary: { fontSize: 9, lineHeight: 1.6, color: "#334155", marginBottom: 4 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e3a5f", textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 6, marginTop: 12, borderBottomWidth: 1.5, borderBottomColor: "#3b82f6", paddingBottom: 2 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  entryDate: { fontSize: 8.5, color: "#64748b" },
  entrySubtitle: { fontSize: 8.5, color: "#64748b", marginBottom: 3 },
  entrySummary: { fontSize: 8.5, color: "#475569", marginBottom: 2, lineHeight: 1.4 },
  bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 6 },
  bulletDot: { width: 7, fontSize: 9, color: "#3b82f6" },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.4 },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillName: { fontFamily: "Helvetica-Bold", fontSize: 8.5, width: 90, color: "#1e3a5f" },
  skillKeywords: { flex: 1, fontSize: 8.5, color: "#475569" },
});

function NovaTemplate({ resume }: { resume: JsonResume }) {
  const b = resume.basics;
  return (
    <Document>
      <Page size="A4" style={novaS.page}>
        {/* Sidebar */}
        <View style={novaS.sidebar}>
          <Text style={novaS.sidebarName}>{b.name || "Your Name"}</Text>
          {b.label ? <Text style={novaS.sidebarLabel}>{b.label}</Text> : null}

          <Text style={novaS.sidebarSection}>Contact</Text>
          {b.email ? <Text style={novaS.sidebarText}>{b.email}</Text> : null}
          {b.phone ? <Text style={novaS.sidebarText}>{b.phone}</Text> : null}
          {b.location.city ? <Text style={novaS.sidebarText}>{[b.location.city, b.location.region].filter(Boolean).join(", ")}</Text> : null}
          {b.linkedin ? <Text style={novaS.sidebarText}>{b.linkedin}</Text> : null}
          {b.github ? <Text style={novaS.sidebarText}>{b.github}</Text> : null}
          {b.website ? <Text style={novaS.sidebarText}>{b.website}</Text> : null}

          {resume.skills.length > 0 && (
            <>
              <Text style={novaS.sidebarSection}>Skills</Text>
              {resume.skills.map((sk, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={novaS.sidebarSkillName}>{sk.name}</Text>
                  <Text style={{ fontSize: 8, color: "#94a3b8", lineHeight: 1.4 }}>{(sk.keywords || []).join(" · ")}</Text>
                </View>
              ))}
            </>
          )}

          {resume.languages.length > 0 && (
            <>
              <Text style={novaS.sidebarSection}>Languages</Text>
              {resume.languages.map((l, i) => (
                <Text key={i} style={novaS.sidebarText}>{l.language} — {l.fluency}</Text>
              ))}
            </>
          )}

          {resume.certifications.length > 0 && (
            <>
              <Text style={novaS.sidebarSection}>Certifications</Text>
              {resume.certifications.map((c, i) => (
                <View key={i} style={{ marginBottom: 5 }}>
                  <Text style={novaS.sidebarSkillName}>{c.name}</Text>
                  <Text style={{ fontSize: 8, color: "#94a3b8" }}>{c.issuer}{c.date ? ` · ${c.date}` : ""}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Main */}
        <View style={novaS.main}>
          {b.summary ? (
            <>
              <Text style={novaS.sectionTitle}>Profile</Text>
              <Text style={novaS.summary}>{b.summary}</Text>
            </>
          ) : null}

          {resume.work.length > 0 && (
            <>
              <Text style={novaS.sectionTitle}>Experience</Text>
              {resume.work.map((w, i) => (
                <View key={i} style={{ marginBottom: 9 }}>
                  <View style={novaS.entryHeader}>
                    <Text style={novaS.entryTitle}>{w.position}</Text>
                    <Text style={novaS.entryDate}>{w.startDate}{w.startDate ? " — " : ""}{w.endDate || "Present"}</Text>
                  </View>
                  <Text style={novaS.entrySubtitle}>{w.name}</Text>
                  {w.summary ? <Text style={novaS.entrySummary}>{w.summary}</Text> : null}
                  <Bullets items={w.highlights} s={novaS} />
                </View>
              ))}
            </>
          )}

          {resume.projects.length > 0 && (
            <>
              <Text style={novaS.sectionTitle}>Projects</Text>
              {resume.projects.map((p, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={novaS.entryHeader}>
                    <Text style={novaS.entryTitle}>{p.name}</Text>
                    {p.endDate ? <Text style={novaS.entryDate}>{p.endDate}</Text> : null}
                  </View>
                  {p.technologies?.length ? <Text style={novaS.entrySubtitle}>{p.technologies.join(", ")}</Text> : null}
                  {p.description ? <Text style={novaS.entrySummary}>{p.description}</Text> : null}
                  <Bullets items={p.highlights} s={novaS} />
                </View>
              ))}
            </>
          )}

          {resume.education.length > 0 && (
            <>
              <Text style={novaS.sectionTitle}>Education</Text>
              {resume.education.map((ed, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <View style={novaS.entryHeader}>
                    <Text style={novaS.entryTitle}>{[ed.studyType, ed.area].filter(Boolean).join(" in ")}</Text>
                    <Text style={novaS.entryDate}>{ed.startDate}{ed.startDate ? " — " : ""}{ed.endDate}</Text>
                  </View>
                  <Text style={novaS.entrySubtitle}>{ed.institution}{ed.gpa ? `  ·  GPA: ${ed.gpa}` : ""}</Text>
                </View>
              ))}
            </>
          )}

          {/* Awards & custom in main column */}
          {resume.awards.length > 0 && (
            <>
              <Text style={novaS.sectionTitle}>Awards</Text>
              {resume.awards.map((a, i) => (
                <View key={i} style={{ marginBottom: 5 }}>
                  <View style={novaS.entryHeader}>
                    <Text style={novaS.entryTitle}>{a.title}</Text>
                    <Text style={novaS.entryDate}>{a.date}</Text>
                  </View>
                  <Text style={novaS.entrySubtitle}>{a.awarder}</Text>
                </View>
              ))}
            </>
          )}

          {resume.customSections.map((cs, ci) => (
            cs.entries.length > 0 ? (
              <View key={ci}>
                <Text style={novaS.sectionTitle}>{cs.title || "Custom"}</Text>
                {cs.entries.map((e, ei) => (
                  <View key={ei} style={novaS.skillRow}>
                    <Text style={novaS.skillName}>{e.label}:</Text>
                    <Text style={novaS.skillKeywords}>{e.value}</Text>
                  </View>
                ))}
              </View>
            ) : null
          ))}
        </View>
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════════════════════════════
   TEMPLATE 5 — MINIMAL INK
   Ultra-clean, black on white, very tight spacing, designer feel
   ════════════════════════════════════════════════════════════════ */
const inkS = StyleSheet.create({
  page: { padding: "44 48", fontSize: 9.5, fontFamily: "Helvetica", color: "#111" },
  name: { fontSize: 28, fontFamily: "Helvetica-Bold", letterSpacing: -1, marginBottom: 1 },
  label: { fontSize: 10, color: "#666", marginBottom: 8 },
  contactRow: { flexDirection: "row", gap: 16, fontSize: 8.5, color: "#888", marginBottom: 20, flexWrap: "wrap" },
  rule: { borderBottomWidth: 1, borderBottomColor: "#000", marginBottom: 14 },
  summary: { fontSize: 9.5, lineHeight: 1.65, color: "#333", marginBottom: 4 },
  sectionTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, textTransform: "uppercase" as const, color: "#000", marginBottom: 6, marginTop: 14 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  entryDate: { fontSize: 8.5, color: "#888" },
  entrySubtitle: { fontSize: 8.5, color: "#666", marginBottom: 3 },
  entrySummary: { fontSize: 8.5, color: "#444", marginBottom: 3, lineHeight: 1.45 },
  bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 7 },
  bulletDot: { width: 6, fontSize: 8.5, color: "#000" },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.45, color: "#333" },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillName: { fontFamily: "Helvetica-Bold", fontSize: 8.5, width: 110, color: "#000" },
  skillKeywords: { flex: 1, fontSize: 8.5, color: "#555" },
});

function MinimalInkTemplate({ resume }: { resume: JsonResume }) {
  const b = resume.basics;
  return (
    <Document>
      <Page size="A4" style={inkS.page}>
        <Text style={inkS.name}>{b.name || "Your Name"}</Text>
        {b.label ? <Text style={inkS.label}>{b.label}</Text> : null}
        <View style={inkS.contactRow}>
          {b.email ? <Text>{b.email}</Text> : null}
          {b.phone ? <Text>{b.phone}</Text> : null}
          {b.location.city ? <Text>{[b.location.city, b.location.region].filter(Boolean).join(", ")}</Text> : null}
          {b.linkedin ? <Text>{b.linkedin}</Text> : null}
          {b.github ? <Text>{b.github}</Text> : null}
          {b.website ? <Text>{b.website}</Text> : null}
        </View>
        <View style={inkS.rule} />
        <Sections resume={resume} s={inkS} />
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════════════════════════════
   TEMPLATE 6 — BOLD CREATIVE
   Dark charcoal header, emerald accent, strong typographic contrast
   ════════════════════════════════════════════════════════════════ */
const boldS = StyleSheet.create({
  page: { fontSize: 9.5, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { backgroundColor: "#18181b", padding: "28 40 22 40" },
  name: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: -0.5 },
  label: { fontSize: 11, color: "#10b981", marginTop: 3 },
  contactRow: { flexDirection: "row", gap: 14, fontSize: 8.5, color: "#a1a1aa", marginTop: 8, flexWrap: "wrap" },
  body: { padding: "24 40 40 40" },
  summary: { fontSize: 9.5, lineHeight: 1.6, color: "#3f3f46", marginBottom: 4 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#10b981", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6, marginTop: 14, borderBottomWidth: 1, borderBottomColor: "#d4f7ec", paddingBottom: 2 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryDate: { fontSize: 8.5, color: "#71717a" },
  entrySubtitle: { fontSize: 8.5, color: "#71717a", marginBottom: 3 },
  entrySummary: { fontSize: 8.5, color: "#52525b", marginBottom: 3, lineHeight: 1.45 },
  bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 7 },
  bulletDot: { width: 7, fontSize: 9, color: "#10b981" },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.45, color: "#3f3f46" },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillName: { fontFamily: "Helvetica-Bold", fontSize: 8.5, width: 110, color: "#18181b" },
  skillKeywords: { flex: 1, fontSize: 8.5, color: "#52525b" },
});

function BoldCreativeTemplate({ resume }: { resume: JsonResume }) {
  const b = resume.basics;
  return (
    <Document>
      <Page size="A4" style={boldS.page}>
        <View style={boldS.header}>
          <Text style={boldS.name}>{b.name || "Your Name"}</Text>
          {b.label ? <Text style={boldS.label}>{b.label}</Text> : null}
          <View style={boldS.contactRow}>
            {b.email ? <Text>{b.email}</Text> : null}
            {b.phone ? <Text>{b.phone}</Text> : null}
            {b.location.city ? <Text>{[b.location.city, b.location.region].filter(Boolean).join(", ")}</Text> : null}
            {b.linkedin ? <Text>{b.linkedin}</Text> : null}
            {b.github ? <Text>{b.github}</Text> : null}
            {b.website ? <Text>{b.website}</Text> : null}
          </View>
        </View>
        <View style={boldS.body}>
          <Sections resume={resume} s={boldS} />
        </View>
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════════════════════════════
   EXPORTS
   ════════════════════════════════════════════════════════════════ */
interface Props { resume: JsonResume; template: CVTemplate; }

export function CVPdfDocument({ resume, template }: Props) {
  switch (template) {
    case "startup":       return <StartupTemplate resume={resume} />;
    case "executive":     return <ExecutiveTemplate resume={resume} />;
    case "nova":          return <NovaTemplate resume={resume} />;
    case "minimal-ink":   return <MinimalInkTemplate resume={resume} />;
    case "bold-creative": return <BoldCreativeTemplate resume={resume} />;
    default:              return <ATSTemplate resume={resume} />;
  }
}

/* ── Cover Letter (shares template colour palette) ── */
const clStyles: Record<CVTemplate, any> = {
  "ats-crusher": StyleSheet.create({
    page: { padding: 50, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
    name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
    contact: { fontSize: 9, color: "#666", marginBottom: 20 },
    date: { fontSize: 10, color: "#555", marginBottom: 14 },
    recipient: { fontSize: 10, marginBottom: 20 },
    body: { fontSize: 10.5, lineHeight: 1.75, color: "#222", marginBottom: 10 },
    closing: { fontSize: 10.5, marginTop: 6 },
    sig: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 22 },
  }),
  startup: StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
    header: { backgroundColor: "#4338ca", padding: "20 40 14 40", marginHorizontal: -40, marginTop: -40, marginBottom: 22 },
    name: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#fff" },
    contact: { fontSize: 9, color: "#e0e7ff", marginTop: 5 },
    date: { fontSize: 10, color: "#64748b", marginBottom: 14 },
    recipient: { fontSize: 10, color: "#475569", marginBottom: 20 },
    body: { fontSize: 10.5, lineHeight: 1.75, color: "#334155", marginBottom: 10 },
    closing: { fontSize: 10.5, color: "#334155", marginTop: 6 },
    sig: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#4338ca", marginTop: 22 },
  }),
  executive: StyleSheet.create({
    page: { padding: 56, fontSize: 11, fontFamily: "Times-Roman", color: "#1a1a1a" },
    name: { fontSize: 20, fontFamily: "Times-Bold", textAlign: "center" as const, letterSpacing: 2, textTransform: "uppercase" as const },
    contact: { fontSize: 9, color: "#555", textAlign: "center" as const, marginTop: 5, marginBottom: 20 },
    date: { fontSize: 10, fontFamily: "Times-Italic", color: "#555", marginBottom: 14 },
    recipient: { fontSize: 10, marginBottom: 20 },
    body: { fontSize: 10.5, lineHeight: 1.8, color: "#222", fontFamily: "Times-Roman", marginBottom: 10, textAlign: "justify" as const },
    closing: { fontSize: 10.5, fontFamily: "Times-Italic", marginTop: 6 },
    sig: { fontSize: 11, fontFamily: "Times-Bold", marginTop: 22 },
  }),
  nova: StyleSheet.create({
    page: { padding: "44 48", fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
    name: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#1e3a5f", marginBottom: 2 },
    contact: { fontSize: 9, color: "#64748b", marginBottom: 20 },
    date: { fontSize: 10, color: "#64748b", marginBottom: 14 },
    recipient: { fontSize: 10, color: "#475569", marginBottom: 20 },
    body: { fontSize: 10.5, lineHeight: 1.75, color: "#334155", marginBottom: 10 },
    closing: { fontSize: 10.5, color: "#334155", marginTop: 6 },
    sig: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1e3a5f", marginTop: 22 },
  }),
  "minimal-ink": StyleSheet.create({
    page: { padding: "44 50", fontSize: 11, fontFamily: "Helvetica", color: "#111" },
    name: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: -1, marginBottom: 2 },
    contact: { fontSize: 8.5, color: "#888", marginBottom: 20 },
    date: { fontSize: 10, color: "#888", marginBottom: 14 },
    recipient: { fontSize: 10, color: "#333", marginBottom: 20 },
    body: { fontSize: 10.5, lineHeight: 1.75, color: "#222", marginBottom: 10 },
    closing: { fontSize: 10.5, marginTop: 6 },
    sig: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 22 },
  }),
  "bold-creative": StyleSheet.create({
    page: { fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
    header: { backgroundColor: "#18181b", padding: "24 40 18 40" },
    name: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#fff" },
    contact: { fontSize: 9, color: "#a1a1aa", marginTop: 5 },
    body: { padding: "24 40 40 40" },
    date: { fontSize: 10, color: "#71717a", marginBottom: 14 },
    recipient: { fontSize: 10, color: "#52525b", marginBottom: 20 },
    bodyText: { fontSize: 10.5, lineHeight: 1.75, color: "#3f3f46", marginBottom: 10 },
    closing: { fontSize: 10.5, color: "#3f3f46", marginTop: 6 },
    sig: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#10b981", marginTop: 22 },
  }),
};

interface CLProps { coverLetter: string; resume: JsonResume; template: CVTemplate; companyName: string; }

export function CoverLetterPdfDocument({ coverLetter, resume, template, companyName }: CLProps) {
  const s = clStyles[template] || clStyles["ats-crusher"];
  const b = resume.basics;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const paras = coverLetter.split(/\n\n+/).filter(Boolean);
  const contactLine = [b.email, b.phone, b.location?.city].filter(Boolean).join("  ·  ");
  const isBold = template === "bold-creative";
  const isStartup = template === "startup";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Headers that need a coloured band */}
        {(isBold || isStartup) && (
          <View style={s.header}>
            <Text style={s.name}>{b.name || "Your Name"}</Text>
            <Text style={s.contact}>{contactLine}</Text>
          </View>
        )}
        {!isBold && !isStartup && (
          <>
            <Text style={s.name}>{b.name || "Your Name"}</Text>
            <Text style={s.contact}>{contactLine}</Text>
          </>
        )}

        <View style={isBold ? s.body : {}}>
          <Text style={s.date}>{today}</Text>
          {companyName ? <Text style={s.recipient}>Hiring Manager{"\n"}{companyName}</Text> : null}
          {paras.map((p, i) => (
            <Text key={i} style={isBold ? s.bodyText : s.body}>{p.trim()}</Text>
          ))}
          <Text style={s.closing}>Sincerely,</Text>
          <Text style={s.sig}>{b.name || "Your Name"}</Text>
        </View>
      </Page>
    </Document>
  );
}
