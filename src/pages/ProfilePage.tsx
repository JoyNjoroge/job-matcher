import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfile, parseResumeForProfile, parseLinkedInForProfile } from "@/api";
import { Upload, Save, Loader, Link2, X, User, Briefcase, Globe, FileText } from "lucide-react";

interface Profile {
  id: string; full_name: string | null; phone: string | null; location: string | null;
  job_titles: string[]; skills: string[]; experience_level: string | null;
  linkedin_url: string | null; github_url: string | null; portfolio_url: string | null; summary: string | null;
}
interface ParsedData {
  full_name?: string; email?: string; phone?: string; location?: string; summary?: string;
  job_titles?: string[]; skills?: string[]; experience_level?: string;
  education?: any[]; experience?: any[]; projects?: any[];
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
  const [parsingLinkedIn, setParsingLinkedIn] = useState(false);
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

  const handleLinkedInParse = async () => {
    if (!linkedinUrl.trim()) return;
    setParsingLinkedIn(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("No auth token");
      const result = await parseLinkedInForProfile(accessToken, linkedinUrl, false);
      if (result.parsed_data) { setParsedData(result.parsed_data); setShowParsedPreview(true); toast({ title: "Parsed!", description: "Review the extracted data below." }); }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to parse LinkedIn", variant: "destructive" });
    } finally { setParsingLinkedIn(false); }
  };

  const applyParsedData = () => {
    if (!parsedData) return;
    const updates: Partial<Profile> = { ...formData };
    if (parsedData.full_name && !formData.full_name) updates.full_name = parsedData.full_name;
    if (parsedData.phone && !formData.phone) updates.phone = parsedData.phone;
    if (parsedData.location && !formData.location) updates.location = parsedData.location;
    if (parsedData.summary && !formData.summary) updates.summary = parsedData.summary;
    if (parsedData.experience_level && !formData.experience_level) updates.experience_level = parsedData.experience_level;
    if (parsedData.job_titles?.length) updates.job_titles = [...new Set([...(formData.job_titles || []), ...parsedData.job_titles])];
    if (parsedData.skills?.length) updates.skills = [...new Set([...(formData.skills || []), ...parsedData.skills])];
    setFormData(updates);
    setShowParsedPreview(false);
    setParsedData(null);
    toast({ title: "Applied!", description: "Parsed data merged into your profile." });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(37,99,235,0.2)", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ color: "#6B7280", fontSize: 14 }}>Loading your profile…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="profile-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .profile-root { font-family: 'DM Sans', sans-serif; max-width: 860px; margin: 0 auto; padding: 48px 24px 80px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pr-header { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid rgba(0,0,0,0.07); }
        .pr-avatar { width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, #2563EB, #7C3AED); display: flex; align-items: center; justify-content: center; color: white; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px; flex-shrink: 0; }
        .pr-header-text h1 { font-family: 'Syne', sans-serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -0.025em; color: #0A0A0F; margin: 0 0 6px; }
        .pr-header-text p { color: #6B7280; font-size: 14px; margin: 0; font-weight: 300; }

        /* Cards */
        .pr-card { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 20px; overflow: hidden; margin-bottom: 20px; }
        .pr-card-header { display: flex; align-items: center; gap: 12px; padding: 22px 28px 0; }
        .pr-card-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pr-card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; color: #0A0A0F; margin: 0 0 2px; }
        .pr-card-desc { font-size: 12px; color: #9CA3AF; margin: 0; }
        .pr-card-body { padding: 20px 28px 28px; }

        /* Inputs */
        .pr-field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .pr-input {
          width: 100%; height: 44px; padding: 0 14px;
          border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0F;
          background: #F9FAFB; outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .pr-input:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .pr-select { width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0F; background: #F9FAFB; outline: none; cursor: pointer; box-sizing: border-box; }
        .pr-select:focus { border-color: #2563EB; background: white; }
        .pr-textarea { width: 100%; min-height: 100px; padding: 12px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0F; background: #F9FAFB; outline: none; resize: vertical; transition: all 0.2s; line-height: 1.6; box-sizing: border-box; }
        .pr-textarea:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .pr-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .pr-field { display: flex; flex-direction: column; }

        /* Tags */
        .pr-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .pr-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 999px;
          font-size: 13px; font-weight: 500;
        }
        .pr-tag-skill { background: rgba(37,99,235,0.08); color: #2563EB; }
        .pr-tag-title { background: rgba(124,58,237,0.08); color: #7C3AED; }
        .pr-tag-remove { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.6; padding: 0; display: flex; align-items: center; transition: opacity 0.2s; }
        .pr-tag-remove:hover { opacity: 1; }
        .pr-add-row { display: flex; gap: 8px; }

        /* Buttons */
        .pr-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 44px; padding: 0 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
        .pr-btn-primary { background: #2563EB; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.28); }
        .pr-btn-primary:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); }
        .pr-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .pr-btn-outline { background: white; color: #0A0A0F; border: 1.5px solid rgba(0,0,0,0.12); }
        .pr-btn-outline:hover:not(:disabled) { border-color: rgba(0,0,0,0.25); }
        .pr-btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }
        .pr-btn-sm { height: 36px; padding: 0 14px; font-size: 13px; }

        /* Upload zone */
        .pr-upload-zone { border: 2px dashed rgba(37,99,235,0.25); border-radius: 14px; padding: 28px; text-align: center; transition: all 0.2s; background: rgba(37,99,235,0.02); }
        .pr-upload-zone:hover { border-color: rgba(37,99,235,0.5); background: rgba(37,99,235,0.04); }
        .pr-upload-icon { width: 44px; height: 44px; background: rgba(37,99,235,0.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .pr-upload-label { font-weight: 600; font-size: 14px; color: #0A0A0F; margin-bottom: 4px; }
        .pr-upload-hint { font-size: 12px; color: #9CA3AF; margin-bottom: 14px; }

        /* Parsed preview */
        .pr-parsed-preview { background: rgba(37,99,235,0.04); border: 1.5px solid rgba(37,99,235,0.2); border-radius: 14px; padding: 18px 20px; margin-top: 14px; }
        .pr-parsed-title { font-weight: 700; font-size: 14px; color: #2563EB; margin-bottom: 10px; }
        .pr-parsed-item { font-size: 13px; color: #374151; margin-bottom: 6px; }
        .pr-parsed-actions { display: flex; gap: 8px; margin-top: 14px; }

        /* LinkedIn row */
        .pr-linkedin-row { display: flex; gap: 10px; }

        /* Save bar */
        .pr-save-bar { display: flex; justify-content: flex-end; padding-top: 8px; }
        .pr-save-btn { height: 50px; padding: 0 32px; background: #2563EB; color: white; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 9px; box-shadow: 0 6px 20px rgba(37,99,235,0.3); }
        .pr-save-btn:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(37,99,235,0.4); }
        .pr-save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .pr-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
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
          <div className="pr-card-icon" style={{ background: "rgba(37,99,235,0.08)" }}>
            <FileText size={18} color="#2563EB" />
          </div>
          <div>
            <div className="pr-card-title">Import from Resume</div>
            <div className="pr-card-desc">Upload your CV and we'll extract your details automatically</div>
          </div>
        </div>
        <div className="pr-card-body">
          <div className="pr-upload-zone">
            <div className="pr-upload-icon"><Upload size={20} color="#2563EB" /></div>
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
            <div className="pr-card-title">Import from LinkedIn</div>
            <div className="pr-card-desc">Paste your LinkedIn profile URL to extract your info</div>
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
              disabled={parsingLinkedIn}
            />
            <button className="pr-btn pr-btn-primary" onClick={handleLinkedInParse} disabled={!linkedinUrl.trim() || parsingLinkedIn} style={{ flexShrink: 0 }}>
              {parsingLinkedIn ? <><div className="pr-spinner" /> Parsing...</> : <><Link2 size={15} /> Parse</>}
            </button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(16,185,129,0.1)" }}>
            <User size={18} color="#10B981" />
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
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="pr-card">
        <div className="pr-card-header">
          <div className="pr-card-icon" style={{ background: "rgba(124,58,237,0.1)" }}>
            <Briefcase size={18} color="#7C3AED" />
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
