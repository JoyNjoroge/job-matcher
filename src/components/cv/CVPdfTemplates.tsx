import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { JsonResume, CVTemplate } from "@/types/jsonResume";

// ─── ATS Crusher (Clean / Minimal) ───
const atsStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { marginBottom: 16 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  label: { fontSize: 12, color: "#555", marginBottom: 6 },
  contactRow: { flexDirection: "row", gap: 12, fontSize: 9, color: "#666", marginBottom: 4 },
  summary: { fontSize: 10, lineHeight: 1.5, color: "#333", marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 3, marginBottom: 8, marginTop: 12 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryDate: { fontSize: 9, color: "#666" },
  entrySubtitle: { fontSize: 9, color: "#555", marginBottom: 4 },
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 8 },
  bulletDot: { width: 6, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.4, color: "#333" },
  skillRow: { flexDirection: "row", marginBottom: 3 },
  skillName: { fontFamily: "Helvetica-Bold", fontSize: 9, width: 100 },
  skillKeywords: { flex: 1, fontSize: 9, color: "#444" },
});

// ─── Startup (Modern) ───
const startupStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  header: { backgroundColor: "#4338ca", color: "#fff", padding: 20, marginHorizontal: -36, marginTop: -36, marginBottom: 16 },
  name: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#fff" },
  label: { fontSize: 13, color: "#c7d2fe", marginTop: 2 },
  contactRow: { flexDirection: "row", gap: 14, fontSize: 9, color: "#e0e7ff", marginTop: 8 },
  summary: { fontSize: 10, lineHeight: 1.6, color: "#334155", marginBottom: 14, backgroundColor: "#f1f5f9", padding: 10, borderRadius: 4 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#4338ca", textTransform: "uppercase" as any, letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryDate: { fontSize: 9, color: "#64748b" },
  entrySubtitle: { fontSize: 9, color: "#64748b", marginBottom: 4 },
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 8 },
  bulletDot: { width: 8, fontSize: 10, color: "#4338ca" },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.4 },
  skillRow: { flexDirection: "row", marginBottom: 4 },
  skillName: { fontFamily: "Helvetica-Bold", fontSize: 9, width: 100, color: "#4338ca" },
  skillKeywords: { flex: 1, fontSize: 9, color: "#475569" },
});

// ─── Executive (Serif / Classic) ───
const execStyles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Times-Roman", color: "#1a1a1a" },
  header: { textAlign: "center" as any, marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#1a1a1a", paddingBottom: 12 },
  name: { fontSize: 26, fontFamily: "Times-Bold", letterSpacing: 2, textTransform: "uppercase" as any },
  label: { fontSize: 12, fontFamily: "Times-Italic", color: "#444", marginTop: 4 },
  contactRow: { flexDirection: "row", justifyContent: "center", gap: 16, fontSize: 9, color: "#555", marginTop: 8 },
  summary: { fontSize: 10, lineHeight: 1.6, color: "#333", fontFamily: "Times-Italic", marginBottom: 16, textAlign: "justify" as any },
  sectionTitle: { fontSize: 12, fontFamily: "Times-Bold", textTransform: "uppercase" as any, letterSpacing: 1.5, borderBottomWidth: 1, borderBottomColor: "#999", paddingBottom: 3, marginBottom: 10, marginTop: 14 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  entryTitle: { fontFamily: "Times-Bold", fontSize: 10 },
  entryDate: { fontSize: 9, fontFamily: "Times-Italic", color: "#555" },
  entrySubtitle: { fontSize: 9, fontFamily: "Times-Italic", color: "#555", marginBottom: 4 },
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 10 },
  bulletDot: { width: 8, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.5 },
  skillRow: { flexDirection: "row", marginBottom: 3 },
  skillName: { fontFamily: "Times-Bold", fontSize: 9, width: 110 },
  skillKeywords: { flex: 1, fontSize: 9, color: "#444" },
});

const styleMap: Record<CVTemplate, any> = {
  "ats-crusher": atsStyles,
  startup: startupStyles,
  executive: execStyles,
};

interface Props {
  resume: JsonResume;
  template: CVTemplate;
}

export function CVPdfDocument({ resume, template }: Props) {
  const s = styleMap[template];
  const b = resume.basics;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.name}>{b.name || "Your Name"}</Text>
          {b.label ? <Text style={s.label}>{b.label}</Text> : null}
          <View style={s.contactRow}>
            {b.email ? <Text>{b.email}</Text> : null}
            {b.phone ? <Text>{b.phone}</Text> : null}
            {b.location.city ? <Text>{[b.location.city, b.location.region].filter(Boolean).join(", ")}</Text> : null}
          </View>
        </View>

        {/* Summary */}
        {b.summary ? (
          <>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.summary}>{b.summary}</Text>
          </>
        ) : null}

        {/* Work */}
        {resume.work.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {resume.work.map((w, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{w.position}</Text>
                  <Text style={s.entryDate}>{w.startDate} — {w.endDate || "Present"}</Text>
                </View>
                <Text style={s.entrySubtitle}>{w.name}</Text>
                {w.summary ? <Text style={{ fontSize: 9, marginBottom: 3, color: "#444" }}>{w.summary}</Text> : null}
                {w.highlights.filter(Boolean).map((h, hi) => (
                  <View key={hi} style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{h}</Text>
                  </View>
                ))}
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
                  <Text style={s.entryTitle}>{ed.studyType} in {ed.area}</Text>
                  <Text style={s.entryDate}>{ed.startDate} — {ed.endDate}</Text>
                </View>
                <Text style={s.entrySubtitle}>{ed.institution}</Text>
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
                <Text style={s.skillKeywords}>{sk.keywords.join(", ")}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}

/* ─── Cover Letter PDF Templates ─── */

const clAtsStyles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { marginBottom: 24 },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  contactRow: { flexDirection: "row", gap: 12, fontSize: 9, color: "#666", marginBottom: 4 },
  date: { fontSize: 10, color: "#555", marginBottom: 16 },
  recipient: { fontSize: 10, color: "#333", marginBottom: 20 },
  body: { fontSize: 11, lineHeight: 1.7, color: "#222", marginBottom: 12 },
  closing: { fontSize: 11, color: "#222", marginTop: 8 },
  signature: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 24 },
});

const clStartupStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  header: { backgroundColor: "#4338ca", color: "#fff", padding: 20, marginHorizontal: -40, marginTop: -40, marginBottom: 24 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#fff" },
  contactRow: { flexDirection: "row", gap: 14, fontSize: 9, color: "#e0e7ff", marginTop: 6 },
  date: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  recipient: { fontSize: 10, color: "#475569", marginBottom: 20 },
  body: { fontSize: 11, lineHeight: 1.7, color: "#334155", marginBottom: 12 },
  closing: { fontSize: 11, color: "#334155", marginTop: 8 },
  signature: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#4338ca", marginTop: 24 },
});

const clExecStyles = StyleSheet.create({
  page: { padding: 56, fontSize: 11, fontFamily: "Times-Roman", color: "#1a1a1a" },
  header: { textAlign: "center" as any, marginBottom: 28, borderBottomWidth: 2, borderBottomColor: "#1a1a1a", paddingBottom: 14 },
  name: { fontSize: 20, fontFamily: "Times-Bold", letterSpacing: 2, textTransform: "uppercase" as any },
  contactRow: { flexDirection: "row", justifyContent: "center", gap: 16, fontSize: 9, color: "#555", marginTop: 8 },
  date: { fontSize: 10, fontFamily: "Times-Italic", color: "#555", marginBottom: 16 },
  recipient: { fontSize: 10, color: "#333", marginBottom: 20 },
  body: { fontSize: 11, lineHeight: 1.8, color: "#222", fontFamily: "Times-Roman", marginBottom: 12, textAlign: "justify" as any },
  closing: { fontSize: 11, fontFamily: "Times-Italic", color: "#222", marginTop: 8 },
  signature: { fontSize: 11, fontFamily: "Times-Bold", marginTop: 24 },
});

const clStyleMap: Record<CVTemplate, any> = {
  "ats-crusher": clAtsStyles,
  startup: clStartupStyles,
  executive: clExecStyles,
};

interface CoverLetterPdfProps {
  coverLetter: string;
  resume: JsonResume;
  template: CVTemplate;
  companyName: string;
}

export function CoverLetterPdfDocument({ coverLetter, resume, template, companyName }: CoverLetterPdfProps) {
  const s = clStyleMap[template];
  const b = resume.basics;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Split cover letter into paragraphs
  const paragraphs = coverLetter.split(/\n\n+/).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.name}>{b.name || "Your Name"}</Text>
          <View style={s.contactRow}>
            {b.email ? <Text>{b.email}</Text> : null}
            {b.phone ? <Text>{b.phone}</Text> : null}
            {b.location?.city ? <Text>{b.location.city}</Text> : null}
          </View>
        </View>

        {/* Date */}
        <Text style={s.date}>{today}</Text>

        {/* Recipient */}
        {companyName ? (
          <Text style={s.recipient}>Hiring Manager{"\n"}{companyName}</Text>
        ) : null}

        {/* Body */}
        {paragraphs.map((p, i) => (
          <Text key={i} style={s.body}>{p.trim()}</Text>
        ))}

        {/* Signature */}
        <Text style={s.closing}>Sincerely,</Text>
        <Text style={s.signature}>{b.name || "Your Name"}</Text>
      </Page>
    </Document>
  );
}