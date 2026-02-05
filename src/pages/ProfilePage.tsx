import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfile, parseResumeForProfile } from "@/api";
import { Upload, Save, AlertCircle, CheckCircle, Loader } from "lucide-react";

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

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
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
      const result = await parseResumeForProfile(accessToken, resumeFile, true);
      
      if (result.profile) {
        setProfile(result.profile);
        setFormData(result.profile);
        toast({
          title: "Success",
          description: "Resume parsed and profile updated",
        });
      } else {
        toast({
          title: "Info",
          description: result.parsed_data ? "Resume parsed. Review and update manually if needed." : "Resume parsing completed",
        });
      }
      setResumeFile(null);
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

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Auto-Fill from Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your resume (PDF, DOCX, or TXT) to automatically extract and populate your profile information.
          </p>
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
