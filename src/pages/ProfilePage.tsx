import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfile, parseResumeForProfile } from "@/api";
import { Upload, Save, Loader, Link2, X, User, Briefcase, Globe, FileText } from "lucide-react";

interface Profile {
  id: string; full_name: string | null; phone: string | null; location: string | null;
  address_line1: string | null; address_line2: string | null; city: string | null;
  state: string | null; postal_code: string | null; country: string | null;
  job_titles: string[]; skills: string[]; experience_level: string | null;
  linkedin_url: string | null; github_url: string | null; portfolio_url: string | null; summary: string | null;
  education: Record<string, any>[]; work_experience: Record<string, any>[];
  certifications: Record<string, any>[]; projects: Record<string, any>[];
  tools: string[]; languages: Record<string, any>[]; awards: Record<string, any>[];
  volunteer_experience: Record<string, any>[]; publications: Record<string, any>[];
  courses: Record<string, any>[]; interests: string[];
  additional_details: Record<string, any>; years_of_experience: number | null;
}
interface ParsedData {
  full_name?: string; email?: string; phone?: string; location?: string; summary?: string;
  address_line1?: string; address_line2?: string; city?: string;
  state?: string; postal_code?: string; country?: string;
  job_titles?: string[]; skills?: string[]; experience_level?: string;
  education?: Record<string, any>[]; work_experience?: Record<string, any>[];
  certifications?: Record<string, any>[]; projects?: Record<string, any>[];
  tools?: string[]; languages?: Record<string, any>[]; awards?: Record<string, any>[];
  volunteer_experience?: Record<string, any>[]; publications?: Record<string, any>[];
  courses?: Record<string, any>[]; interests?: string[];
  additional_details?: Record<string, any>; years_of_experience?: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showParsedPreview, setShowParsedPreview] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) throw new Error("No auth token");
        const data = await getProfile(accessToken);
        setProfile(data.profile);
        setFormData(data.profile);
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Failed to load profile", variant: "destructive" });
      } finally { setLoading(false); }
    };
    fetchProfile();
  }, [user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim()) { setFormData((prev) => ({ ...prev, skills: [...(prev.skills || []), newSkill.trim()] })); setNewSkill(""); }
  };
  const removeSkill = (i: number) => setFormData((prev) => ({ ...prev, skills: (prev.skills || []).filter((_, idx) => idx !== i) }));
  const addJobTitle = () => {
    if (newJobTitle.trim()) { setFormData((prev) => ({ ...prev, job_titles: [...(prev.job_titles || []), newJobTitle.trim()] })); setNewJobTitle(""); }
  };
  const removeJobTitle = (i: number) => setFormData((prev) => ({ ...prev, job_titles: (prev.job_titles || []).filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("No auth token");
      const updated = await updateProfile(accessToken, formData);
      setProfile(updated.profile);
      toast({ title: "Saved!", description: "Your profile has been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setParsingResume(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("No auth token");
      const result = await parseResumeForProfile(accessToken, resumeFile, false);
      if (result.parsed_data) { setParsedData(result.parsed_data); setShowParsedPreview(true); toast({ title: "Parsed!", description: "Review the extracted data below." }); }
      else toast({ title: "Warning", description: "No data extracted from resume", variant: "destructive" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to parse resume", variant: "destructive" });
    } finally { setParsingResume(false); }
  };

  const handleLinkedInSave = () => {
    if (!linkedinUrl.trim()) return;
    let normalized = linkedinUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try {
      const url = new URL(normalized);
      if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) {
        throw new Error("Enter a valid linkedin.com profile URL");
      }
      setFormData(prev => ({ ...prev, linkedin_url: normalized }));
      setLinkedinUrl("");
      toast({
        title: "LinkedIn URL added",
        description: "Save your profile to keep this change.",
      });
    } catch (err: any) {
      toast({
        title: "Invalid LinkedIn URL",
        description: err?.message || "Enter a valid LinkedIn profile URL",
        variant: "destructive",
      });
    }
  };

  const applyParsedData = () => {
    if (!parsedData) return;
    const updates: Partial<Profile> = { ...formData };
    if (parsedData.full_name && !formData.full_name) updates.full_name = parsedData.full_name;
    if (parsedData.phone && !formData.phone) updates.phone = parsedData.phone;
    if (parsedData.location && !formData.location) updates.location = parsedData.location;
    if (parsedData.address_line1 && !formData.address_line1) updates.address_line1 = parsedData.address_line1;
    if (parsedData.address_line2 && !formData.address_line2) updates.address_line2 = parsedData.address_line2;
    if (parsedData.city && !formData.city) updates.city = parsedData.city;
    if (parsedData.state && !formData.state) updates.state = parsedData.state;
    if (parsedData.postal_code && !formData.postal_code) updates.postal_code = parsedData.postal_code;
    if (parsedData.country && !formData.country) updates.country = parsedData.country;
    if (parsedData.summary && !formData.summary) updates.summary = parsedData.summary;
    if (parsedData.experience_level && !formData.experience_level) updates.experience_level = parsedData.experience_level;
    if (parsedData.job_titles?.length) updates.job_titles = [...new Set([...(formData.job_titles || []), ...parsedData.job_titles])];
    if (parsedData.skills?.length) updates.skills = [...new Set([...(formData.skills || []), ...parsedData.skills])];
    const structuredArrays = [
      "education", "work_experience", "certifications", "projects", "languages",
      "awards", "volunteer_experience", "publications", "courses",
    ] as const;
    structuredArrays.forEach((field) => {
      const incoming = parsedData[field] || [];
      const current = (formData[field] || []) as Record<string, any>[];
      if (incoming.length) {
        const seen = new Set(current.map(item => JSON.stringify(item)));
        updates[field] = [...current, ...incoming.filter(item => !seen.has(JSON.stringify(item)))] as any;
      }
    });
    (["tools", "interests"] as const).forEach((field) => {
      const incoming = parsedData[field] || [];
      if (incoming.length) updates[field] = [...new Set([...(formData[field] || []), ...incoming])] as any;
    });
    if (parsedData.years_of_experience != null) updates.years_of_experience = parsedData.years_of_experience;
    if (parsedData.additional_details && Object.keys(parsedData.additional_details).length) {
      updates.additional_details = {
        ...(formData.additional_details || {}),
        ...parsedData.additional_details,
      };
    }
    setFormData(updates);
    setShowParsedPreview(false);
    setParsedData(null);
    toast({ title: "Applied!", description: "Parsed data merged into your profile." });
  };

  const updateStructuredItem = (
    field: keyof Profile,
    index: number,
    key: string,
    value: string,
    isArray: boolean,
  ) => {
    const items = [...(((formData as any)[field] || []) as Record<string, any>[])];
    items[index] = {
      ...items[index],
      [key]: isArray ? value.split("\n").map(v => v.trim()).filter(Boolean) : value,
    };
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const addStructuredItem = (field: keyof Profile, template: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...((((prev as any)[field] || []) as Record<string, any>[])), template],
    }));
  };

  const removeStructuredItem = (field: keyof Profile, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (((prev as any)[field] || []) as Record<string, any>[]).filter((_, i) => i !== index),
    }));
  };

  const renderStructuredSection = (
    title: string,
    description: string,
    field: keyof Profile,
    template: Record<string, any>,
  ) => {
    const items = (((formData as any)[field] || []) as Record<string, any>[]);
    return (
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(36,92,70,0.08)" }}>
            <Briefcase size={18} color="#245c46" />
          </div>
          <div>
            <div className="pr-card-title">{title}</div>
            <div className="pr-card-desc">{description}</div>
          </div>
        </div>
        <div className="pr-card-body">
          <div className="pr-entry-list">
            {items.map((item, index) => (
              <div className="pr-entry" key={`${String(field)}-${index}`}>
                <div className="pr-entry-top">
                  <strong>{item.title || item.name || item.degree || item.role || item.institution || item.organization || `${title} ${index + 1}`}</strong>
                  <button className="pr-remove-entry" onClick={() => removeStructuredItem(field, index)} aria-label={`Remove ${title} entry`}><X size={14} /></button>
                </div>
                <div className="pr-grid-2">
                  {Object.entries(item).map(([key, value]) => {
                    const isArray = Array.isArray(value);
                    const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div className={`pr-field ${isArray || key === "description" ? "pr-field-wide" : ""}`} key={key}>
                        <label className="pr-field-label">{label}</label>
                        {isArray || key === "description" ? (
                          <textarea
                            className="pr-textarea pr-textarea-small"
                            value={isArray ? value.join("\n") : String(value || "")}
                            onChange={e => updateStructuredItem(field, index, key, e.target.value, isArray)}
                            placeholder={isArray ? "One item per line" : ""}
                          />
                        ) : (
                          <input
                            className="pr-input"
                            value={String(value ?? "")}
                            onChange={e => updateStructuredItem(field, index, key, e.target.value, false)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {!items.length && <p className="pr-empty-section">No entries yet. Resume imports will appear here for review.</p>}
          </div>
          <button className="pr-btn pr-btn-outline pr-btn-sm" onClick={() => addStructuredItem(field, { ...template })}>Add {title.replace(/s$/, "")}</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, fontFamily: "var(--font-ui)" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(36,92,70,0.2)", borderTopColor: "#245c46", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ color: "#6B7280", fontSize: 14 }}>Loading your profile…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="profile-root">
      <style>{`
        .profile-root { font-family: var(--font-ui); max-width: 860px; margin: 0 auto; padding: 48px 24px 80px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pr-header { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid rgba(0,0,0,0.07); }
        .pr-avatar { width: 64px; height: 64px; border-radius: 9px; background: #245c46; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--font-ui); font-weight: 800; font-size: 24px; flex-shrink: 0; }
        .pr-header-text h1 { font-family: var(--font-ui); font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.025em; color: #0A0A0F; margin: 0 0 6px; }
        .pr-header-text p { color: #6B7280; font-size: 14px; margin: 0; font-weight: 300; }

        /* Cards */
        .pr-card { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
        .pr-card-header { display: flex; align-items: center; gap: 12px; padding: 22px 28px 0; }
        .pr-card-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pr-card-title { font-family: var(--font-ui); font-weight: 700; font-size: 1rem; color: #0A0A0F; margin: 0 0 2px; }
        .pr-card-desc { font-size: 12px; color: #9CA3AF; margin: 0; }
        .pr-card-body { padding: 20px 28px 28px; }

        /* Inputs */
        .pr-field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .pr-input {
          width: 100%; height: 44px; padding: 0 14px;
          border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px;
          font-family: var(--font-ui); font-size: 14px; color: #0A0A0F;
          background: #F9FAFB; outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .pr-input:focus { border-color: #245c46; background: white; box-shadow: 0 0 0 3px rgba(36,92,70,0.1); }
        .pr-select { width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-family: var(--font-ui); font-size: 14px; color: #0A0A0F; background: #F9FAFB; outline: none; cursor: pointer; box-sizing: border-box; }
        .pr-select:focus { border-color: #245c46; background: white; }
        .pr-textarea { width: 100%; min-height: 100px; padding: 12px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-family: var(--font-ui); font-size: 14px; color: #0A0A0F; background: #F9FAFB; outline: none; resize: vertical; transition: all 0.2s; line-height: 1.6; box-sizing: border-box; }
        .pr-textarea:focus { border-color: #245c46; background: white; box-shadow: 0 0 0 3px rgba(36,92,70,0.1); }
        .pr-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .pr-field { display: flex; flex-direction: column; }

        /* Tags */
        .pr-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .pr-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 999px;
          font-size: 13px; font-weight: 500;
        }
        .pr-tag-skill { background: rgba(36,92,70,0.08); color: #245c46; }
        .pr-tag-title { background: rgba(124,58,237,0.08); color: #3f765f; }
        .pr-tag-remove { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.6; padding: 0; display: flex; align-items: center; transition: opacity 0.2s; }
        .pr-tag-remove:hover { opacity: 1; }
        .pr-add-row { display: flex; gap: 8px; }

        /* Buttons */
        .pr-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 44px; padding: 0 18px; border-radius: 10px; font-family: var(--font-ui); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
        .pr-btn-primary { background: #245c46; color: white; box-shadow: 0 4px 14px rgba(36,92,70,0.28); }
        .pr-btn-primary:hover:not(:disabled) { background: #193f31; transform: translateY(-1px); }
        .pr-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .pr-btn-outline { background: white; color: #0A0A0F; border: 1.5px solid rgba(0,0,0,0.12); }
        .pr-btn-outline:hover:not(:disabled) { border-color: rgba(0,0,0,0.25); }
        .pr-btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }
        .pr-btn-sm { height: 36px; padding: 0 14px; font-size: 13px; }

        /* Upload zone */
        .pr-upload-zone { border: 2px dashed rgba(36,92,70,0.25); border-radius: 14px; padding: 28px; text-align: center; transition: all 0.2s; background: rgba(36,92,70,0.02); }
        .pr-upload-zone:hover { border-color: rgba(36,92,70,0.5); background: rgba(36,92,70,0.04); }
        .pr-upload-icon { width: 44px; height: 44px; background: rgba(36,92,70,0.08); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .pr-upload-label { font-weight: 600; font-size: 14px; color: #0A0A0F; margin-bottom: 4px; }
        .pr-upload-hint { font-size: 12px; color: #9CA3AF; margin-bottom: 14px; }

        /* Parsed preview */
        .pr-parsed-preview { background: rgba(36,92,70,0.04); border: 1.5px solid rgba(36,92,70,0.2); border-radius: 14px; padding: 18px 20px; margin-top: 14px; }
        .pr-parsed-title { font-weight: 700; font-size: 14px; color: #245c46; margin-bottom: 10px; }
        .pr-parsed-item { font-size: 13px; color: #374151; margin-bottom: 6px; }
        .pr-parsed-actions { display: flex; gap: 8px; margin-top: 14px; }

        /* LinkedIn row */
        .pr-linkedin-row { display: flex; gap: 10px; }

        /* Save bar */
        .pr-save-bar { display: flex; justify-content: flex-end; padding-top: 8px; }
        .pr-save-btn { height: 50px; padding: 0 32px; background: #245c46; color: white; border: none; border-radius: 8px; font-family: var(--font-ui); font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 9px; box-shadow: 0 6px 20px rgba(36,92,70,0.3); }
        .pr-save-btn:hover:not(:disabled) { background: #193f31; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(36,92,70,0.4); }
        .pr-save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .pr-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        .pr-entry-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 14px; }
        .pr-entry { border: 1px solid #dfe4df; background: #fafaf7; border-radius: 8px; padding: 16px; }
        .pr-entry-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; color: #17201d; font-size: 14px; }
        .pr-remove-entry { border: 0; background: #eef0ed; color: #66706b; border-radius: 6px; width: 28px; height: 28px; display: grid; place-items: center; cursor: pointer; }
        .pr-field-wide { grid-column: 1 / -1; }
        .pr-textarea-small { min-height: 76px; }
        .pr-empty-section { color: #78817d; font-size: 13px; margin: 0; }
        .pr-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media (max-width: 640px) {
          .pr-card-header { padding: 18px 18px 0; }
          .pr-card-body { padding: 18px; }
          .pr-linkedin-row, .pr-add-row { flex-direction: column; }
          .pr-detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div className="pr-header">
        <div className="pr-avatar">
          {(formData.full_name || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div className="pr-header-text">
          <h1>{formData.full_name || "Your Profile"}</h1>
          <p>{user?.email} · {formData.experience_level || "Experience level not set"}</p>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(36,92,70,0.08)" }}>
            <FileText size={18} color="#245c46" />
          </div>
          <div>
            <div className="pr-card-title">Import from Resume</div>
            <div className="pr-card-desc">Upload your CV and we'll extract your details automatically</div>
          </div>
        </div>
        <div className="pr-card-body">
          <div className="pr-upload-zone">
            <div className="pr-upload-icon"><Upload size={20} color="#245c46" /></div>
            <div className="pr-upload-label">{resumeFile ? resumeFile.name : "Drop your CV here"}</div>
            <div className="pr-upload-hint">PDF, DOC, DOCX supported</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <label style={{ cursor: "pointer" }}>
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                <span className="pr-btn pr-btn-outline pr-btn-sm">Browse File</span>
              </label>
              {resumeFile && (
                <button className="pr-btn pr-btn-primary pr-btn-sm" onClick={handleResumeUpload} disabled={parsingResume}>
                  {parsingResume ? <><div className="pr-spinner" /> Parsing...</> : "Parse Resume"}
                </button>
              )}
            </div>
          </div>

          {showParsedPreview && parsedData && (
            <div className="pr-parsed-preview">
              <div className="pr-parsed-title">Extracted Data — Review before applying</div>
              {parsedData.full_name && <div className="pr-parsed-item">Name: <strong>{parsedData.full_name}</strong></div>}
              {parsedData.phone && <div className="pr-parsed-item">Phone: <strong>{parsedData.phone}</strong></div>}
              {parsedData.location && <div className="pr-parsed-item">Location: <strong>{parsedData.location}</strong></div>}
              {parsedData.skills?.length && <div className="pr-parsed-item">Skills: <strong>{parsedData.skills.slice(0, 6).join(", ")}{parsedData.skills.length > 6 ? ` +${parsedData.skills.length - 6} more` : ""}</strong></div>}
              {!!parsedData.work_experience?.length && <div className="pr-parsed-item">Experience: <strong>{parsedData.work_experience.length} role(s)</strong></div>}
              {!!parsedData.education?.length && <div className="pr-parsed-item">Education: <strong>{parsedData.education.length} entry/entries</strong></div>}
              {!!parsedData.certifications?.length && <div className="pr-parsed-item">Certifications: <strong>{parsedData.certifications.length}</strong></div>}
              {!!parsedData.projects?.length && <div className="pr-parsed-item">Projects: <strong>{parsedData.projects.length}</strong></div>}
              {!!parsedData.languages?.length && <div className="pr-parsed-item">Languages: <strong>{parsedData.languages.length}</strong></div>}
              <div className="pr-parsed-actions">
                <button className="pr-btn pr-btn-primary pr-btn-sm" onClick={applyParsedData}>Apply to Profile</button>
                <button className="pr-btn pr-btn-outline pr-btn-sm" onClick={() => { setShowParsedPreview(false); setParsedData(null); }}>Dismiss</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LinkedIn Import */}
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(10,102,194,0.1)" }}>
            <Link2 size={18} color="#0A66C2" />
          </div>
          <div>
            <div className="pr-card-title">LinkedIn profile</div>
            <div className="pr-card-desc">Add your public profile link. LinkedIn sign-in only shares your basic name and email.</div>
          </div>
        </div>
        <div className="pr-card-body">
          <div className="pr-linkedin-row">
            <input
              type="url"
              className="pr-input"
              placeholder="https://www.linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
            <button className="pr-btn pr-btn-primary" onClick={handleLinkedInSave} disabled={!linkedinUrl.trim()} style={{ flexShrink: 0 }}>
              <><Link2 size={15} /> Add link</>
            </button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(16,185,129,0.1)" }}>
            <User size={18} color="#3f765f" />
          </div>
          <div><div className="pr-card-title">Basic Information</div></div>
        </div>
        <div className="pr-card-body">
          <div className="pr-grid-2">
            <div className="pr-field">
              <label className="pr-field-label">Full Name</label>
              <input name="full_name" className="pr-input" value={formData.full_name || ""} onChange={handleInputChange} placeholder="Your name" />
            </div>
            <div className="pr-field">
              <label className="pr-field-label">Phone</label>
              <input name="phone" className="pr-input" value={formData.phone || ""} onChange={handleInputChange} placeholder="+1 (555) 123-4567" />
            </div>
            <div className="pr-field">
              <label className="pr-field-label">Location</label>
              <input name="location" className="pr-input" value={formData.location || ""} onChange={handleInputChange} placeholder="City, Country" />
            </div>
            <div className="pr-field">
              <label className="pr-field-label">Experience Level</label>
              <select name="experience_level" className="pr-select" value={formData.experience_level || ""} onChange={handleInputChange}>
                <option value="">Select level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div className="pr-field pr-field-wide">
              <label className="pr-field-label">Street Address</label>
              <input name="address_line1" className="pr-input" value={formData.address_line1 || ""} onChange={handleInputChange} placeholder="Street and building" />
            </div>
            <div className="pr-field pr-field-wide">
              <label className="pr-field-label">Address Line 2</label>
              <input name="address_line2" className="pr-input" value={formData.address_line2 || ""} onChange={handleInputChange} placeholder="Apartment, suite, or unit (optional)" />
            </div>
            <div className="pr-field">
              <label className="pr-field-label">City</label>
              <input name="city" className="pr-input" value={formData.city || ""} onChange={handleInputChange} placeholder="City" />
            </div>
            <div className="pr-field">
              <label className="pr-field-label">State / County / Province</label>
              <input name="state" className="pr-input" value={formData.state || ""} onChange={handleInputChange} placeholder="State or region" />
            </div>
            <div className="pr-field">
              <label className="pr-field-label">Postal Code</label>
              <input name="postal_code" className="pr-input" value={formData.postal_code || ""} onChange={handleInputChange} placeholder="Postal code" />
            </div>
            <div className="pr-field">
              <label className="pr-field-label">Country</label>
              <input name="country" className="pr-input" value={formData.country || ""} onChange={handleInputChange} placeholder="Country" />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(124,58,237,0.1)" }}>
            <Briefcase size={18} color="#3f765f" />
          </div>
          <div><div className="pr-card-title">Professional Information</div></div>
        </div>
        <div className="pr-card-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Job Titles */}
          <div>
            <label className="pr-field-label">Job Titles</label>
            <div className="pr-tags">
              {(formData.job_titles || []).map((title, i) => (
                <span key={i} className="pr-tag pr-tag-title">
                  {title}
                  <button className="pr-tag-remove" onClick={() => removeJobTitle(i)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="pr-add-row">
              <input className="pr-input" value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} placeholder="e.g. Software Engineer" onKeyDown={(e) => e.key === "Enter" && addJobTitle()} />
              <button className="pr-btn pr-btn-outline pr-btn-sm" onClick={addJobTitle} style={{ flexShrink: 0 }}>Add</button>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="pr-field-label">Skills</label>
            <div className="pr-tags">
              {(formData.skills || []).map((skill, i) => (
                <span key={i} className="pr-tag pr-tag-skill">
                  {skill}
                  <button className="pr-tag-remove" onClick={() => removeSkill(i)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="pr-add-row">
              <input className="pr-input" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="e.g. React, TypeScript" onKeyDown={(e) => e.key === "Enter" && addSkill()} />
              <button className="pr-btn pr-btn-outline pr-btn-sm" onClick={addSkill} style={{ flexShrink: 0 }}>Add</button>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="pr-field-label">Professional Summary</label>
            <textarea name="summary" className="pr-textarea" value={formData.summary || ""} onChange={handleInputChange} placeholder="Write a brief professional summary..." rows={4} />
          </div>
        </div>
      </div>

      {renderStructuredSection(
        "Work Experience",
        "Roles, dates, responsibilities, achievements, and technologies.",
        "work_experience",
        { company: "", title: "", location: "", start_date: "", end_date: "", description: "", achievements: [], technologies: [] },
      )}

      {renderStructuredSection(
        "Education",
        "Institutions, qualifications, fields of study, grades, and dates.",
        "education",
        { institution: "", degree: "", field: "", start_date: "", end_date: "", grade: "", location: "", details: [] },
      )}

      {renderStructuredSection(
        "Certifications",
        "Credentials, issuers, dates, IDs, and verification links.",
        "certifications",
        { name: "", issuer: "", date: "", expiry_date: "", credential_id: "", url: "" },
      )}

      {renderStructuredSection(
        "Projects",
        "Projects, contributions, technologies, links, and measurable outcomes.",
        "projects",
        { name: "", role: "", url: "", start_date: "", end_date: "", description: "", highlights: [], technologies: [] },
      )}

      {renderStructuredSection(
        "Languages",
        "Spoken languages and proficiency.",
        "languages",
        { name: "", proficiency: "" },
      )}

      {renderStructuredSection(
        "Awards",
        "Awards, honors, issuing organizations, and supporting details.",
        "awards",
        { name: "", issuer: "", date: "", description: "" },
      )}

      {renderStructuredSection(
        "Volunteer Experience",
        "Organizations, roles, dates, and contributions.",
        "volunteer_experience",
        { organization: "", role: "", start_date: "", end_date: "", description: "" },
      )}

      {renderStructuredSection(
        "Publications",
        "Articles, papers, publishers, links, and dates.",
        "publications",
        { title: "", publisher: "", date: "", url: "", description: "" },
      )}

      {renderStructuredSection(
        "Courses",
        "Relevant courses and professional training.",
        "courses",
        { name: "", provider: "", date: "" },
      )}

      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(36,92,70,0.08)" }}>
            <FileText size={18} color="#245c46" />
          </div>
          <div>
            <div className="pr-card-title">Additional Resume Details</div>
            <div className="pr-card-desc">Tools, interests, and facts that do not belong in the sections above.</div>
          </div>
        </div>
        <div className="pr-card-body pr-detail-grid">
          <div className="pr-field">
            <label className="pr-field-label">Tools & Technologies</label>
            <textarea
              className="pr-textarea"
              value={(formData.tools || []).join("\n")}
              onChange={e => setFormData(prev => ({ ...prev, tools: e.target.value.split("\n").map(v => v.trim()).filter(Boolean) }))}
              placeholder="One tool per line"
            />
          </div>
          <div className="pr-field">
            <label className="pr-field-label">Interests</label>
            <textarea
              className="pr-textarea"
              value={(formData.interests || []).join("\n")}
              onChange={e => setFormData(prev => ({ ...prev, interests: e.target.value.split("\n").map(v => v.trim()).filter(Boolean) }))}
              placeholder="One interest per line"
            />
          </div>
          <div className="pr-field pr-field-wide">
            <label className="pr-field-label">Other extracted facts</label>
            <textarea
              className="pr-textarea"
              value={Object.entries(formData.additional_details || {}).map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`).join("\n")}
              onChange={e => {
                const details = Object.fromEntries(
                  e.target.value.split("\n").map(line => {
                    const separator = line.indexOf(":");
                    return separator > 0
                      ? [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
                      : [line.trim(), ""];
                  }).filter(([key]) => key)
                );
                setFormData(prev => ({ ...prev, additional_details: details }));
              }}
              placeholder="Label: value"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(245,158,11,0.1)" }}>
            <Globe size={18} color="#F59E0B" />
          </div>
          <div><div className="pr-card-title">Social & Links</div></div>
        </div>
        <div className="pr-card-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { name: "linkedin_url", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/yourprofile" },
              { name: "github_url", label: "GitHub URL", placeholder: "https://github.com/yourprofile" },
              { name: "portfolio_url", label: "Portfolio URL", placeholder: "https://yourportfolio.com" },
            ].map((field) => (
              <div className="pr-field" key={field.name}>
                <label className="pr-field-label">{field.label}</label>
                <input name={field.name} className="pr-input" value={(formData as any)[field.name] || ""} onChange={handleInputChange} placeholder={field.placeholder} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="pr-save-bar">
        <button className="pr-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="pr-spinner" /> Saving…</> : <><Save size={17} /> Save Profile</>}
        </button>
      </div>
    </div>
  );
}
