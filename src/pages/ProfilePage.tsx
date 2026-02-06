import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfile, parseResumeForProfile, parseLinkedInForProfile } from "@/api";
import { Upload, Save, AlertCircle, CheckCircle, Loader, Link2, X, Check } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  job_titles: string[];
  skills: string[];
  experience_level: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  summary: string | null;
}

interface ParsedData {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  job_titles?: string[];
  skills?: string[];
  experience_level?: string;
  education?: any[];
  experience?: any[];
  projects?: any[];
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

  // Fetch profile on mount
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
        toast({
          title: "Error",
          description: err?.message || "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index),
    }));
  };

  const addJobTitle = () => {
    if (newJobTitle.trim()) {
      setFormData((prev) => ({
        ...prev,
        job_titles: [...(prev.job_titles || []), newJobTitle.trim()],
      }));
      setNewJobTitle("");
    }
  };

  const removeJobTitle = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      job_titles: (prev.job_titles || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("No auth token");
      const updated = await updateProfile(accessToken, formData);
      setProfile(updated.profile);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;

    setParsingResume(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("No auth token");
      
      // Parse without auto-apply to preview first
      const result = await parseResumeForProfile(accessToken, resumeFile, false);
      
      if (result.parsed_data) {
        setParsedData(result.parsed_data);
        setShowParsedPreview(true);
        toast({
          title: "Success",
          description: "Resume parsed successfully. Review the extracted data below.",
        });
      } else {
        toast({
          title: "Warning",
          description: "No data could be extracted from the resume",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to parse resume",
        variant: "destructive",
      });
    } finally {
      setParsingResume(false);
    }
  };

  const handleLinkedInParse = async () => {
    if (!linkedinUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a LinkedIn URL",
        variant: "destructive",
      });
      return;
    }

    setParsingLinkedIn(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("No auth token");
      
      const result = await parseLinkedInForProfile(accessToken, linkedinUrl, false);
      
      if (result.parsed_data) {
        setParsedData(result.parsed_data);
        setShowParsedPreview(true);
        toast({
          title: "Success",
          description: "LinkedIn profile parsed successfully. Review the extracted data below.",
        });
      } else {
        toast({
          title: "Warning",
          description: "Could not extract data from LinkedIn profile",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to parse LinkedIn profile",
        variant: "destructive",
      });
    } finally {
      setParsingLinkedIn(false);
    }
  };

  const applyParsedData = () => {
    if (!parsedData) return;

    const updates: Partial<Profile> = { ...formData };

    // Merge parsed data with existing form data
    if (parsedData.full_name && !formData.full_name) {
      updates.full_name = parsedData.full_name;
    }
    if (parsedData.phone && !formData.phone) {
      updates.phone = parsedData.phone;
    }
    if (parsedData.location && !formData.location) {
      updates.location = parsedData.location;
    }
    if (parsedData.summary && !formData.summary) {
      updates.summary = parsedData.summary;
    }
    if (parsedData.experience_level && !formData.experience_level) {
      updates.experience_level = parsedData.experience_level;
    }

    // Merge skills (avoid duplicates)
    if (parsedData.skills?.length) {
      const existingSkills = new Set(formData.skills || []);
      const newSkills = parsedData.skills.filter(s => !existingSkills.has(s));
      updates.skills = [...(formData.skills || []), ...newSkills];
    }

    // Merge job titles (avoid duplicates)
    if (parsedData.job_titles?.length) {
      const existingTitles = new Set(formData.job_titles || []);
      const newTitles = parsedData.job_titles.filter(t => !existingTitles.has(t));
      updates.job_titles = [...(formData.job_titles || []), ...newTitles];
    }

    setFormData(updates);
    setShowParsedPreview(false);
    setParsedData(null);
    setResumeFile(null);
    setLinkedinUrl("");
    
    toast({
      title: "Data Applied",
      description: "Parsed data has been added to your profile. Don't forget to save!",
    });
  };

  const discardParsedData = () => {
    setParsedData(null);
    setShowParsedPreview(false);
    setResumeFile(null);
    setLinkedinUrl("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your professional information and preferences</p>
      </div>

      {/* Parsed Data Preview Modal */}
      {showParsedPreview && parsedData && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Extracted Data Preview
                </CardTitle>
                <CardDescription>Review the information extracted from your resume/LinkedIn</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={discardParsedData}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {parsedData.full_name && (
                <div>
                  <span className="font-medium">Name:</span> {parsedData.full_name}
                </div>
              )}
              {parsedData.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {parsedData.phone}
                </div>
              )}
              {parsedData.location && (
                <div>
                  <span className="font-medium">Location:</span> {parsedData.location}
                </div>
              )}
              {parsedData.experience_level && (
                <div>
                  <span className="font-medium">Experience:</span> {parsedData.experience_level}
                </div>
              )}
            </div>

            {parsedData.job_titles && parsedData.job_titles.length > 0 && (
              <div>
                <span className="font-medium text-sm">Job Titles:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parsedData.job_titles.map((title, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedData.skills && parsedData.skills.length > 0 && (
              <div>
                <span className="font-medium text-sm">Skills ({parsedData.skills.length}):</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parsedData.skills.slice(0, 20).map((skill, idx) => (
                    <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {parsedData.skills.length > 20 && (
                    <span className="text-xs text-muted-foreground">+{parsedData.skills.length - 20} more</span>
                  )}
                </div>
              </div>
            )}

            {parsedData.summary && (
              <div>
                <span className="font-medium text-sm">Summary:</span>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{parsedData.summary}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={applyParsedData} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Apply to Profile
              </Button>
              <Button onClick={discardParsedData} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Auto-Fill from Resume
          </CardTitle>
          <CardDescription>
            Upload your resume (PDF, DOCX, or TXT) to automatically extract and populate your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                disabled={parsingResume}
              />
            </div>
            <Button onClick={handleResumeUpload} disabled={!resumeFile || parsingResume}>
              {parsingResume ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Parse Resume
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Profile Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Import from LinkedIn
          </CardTitle>
          <CardDescription>
            Enter your LinkedIn profile URL to extract your professional information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="https://www.linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                disabled={parsingLinkedIn}
              />
            </div>
            <Button onClick={handleLinkedInParse} disabled={!linkedinUrl.trim() || parsingLinkedIn}>
              {parsingLinkedIn ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Parse LinkedIn
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <Input
                name="full_name"
                value={formData.full_name || ""}
                onChange={handleInputChange}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <Input
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Location</label>
              <Input
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Experience Level</label>
              <select
                name="experience_level"
                value={formData.experience_level || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, experience_level: e.target.value || null }))
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">Select Level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Titles */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Job Titles</label>
            <div className="space-y-2 mb-3">
              {(formData.job_titles || []).map((title, idx) => (
                <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{title}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeJobTitle(idx)}
                    className="h-6 px-2"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="e.g., Software Engineer"
                onKeyDown={(e) => e.key === "Enter" && addJobTitle()}
              />
              <Button onClick={addJobTitle} size="sm">
                Add
              </Button>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Skills</label>
            <div className="space-y-2 mb-3 flex flex-wrap gap-2">
              {(formData.skills || []).map((skill, idx) => (
                <div key={idx} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(idx)}
                    className="ml-1 hover:bg-primary/30 rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g., React, TypeScript"
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
              />
              <Button onClick={addSkill} size="sm">
                Add
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Professional Summary</label>
            <textarea
              name="summary"
              value={formData.summary || ""}
              onChange={handleInputChange}
              placeholder="Write a brief professional summary..."
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social & Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social & Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">LinkedIn URL</label>
            <Input
              name="linkedin_url"
              value={formData.linkedin_url || ""}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">GitHub URL</label>
            <Input
              name="github_url"
              value={formData.github_url || ""}
              onChange={handleInputChange}
              placeholder="https://github.com/yourprofile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Portfolio URL</label>
            <Input
              name="portfolio_url"
              value={formData.portfolio_url || ""}
              onChange={handleInputChange}
              placeholder="https://yourportfolio.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}