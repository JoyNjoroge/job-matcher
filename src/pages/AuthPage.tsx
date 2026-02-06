import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileSearch, Sparkles, Shield, Zap, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "register";

const AuthPage: React.FC<{ mode?: AuthMode }> = ({ mode = "login" }) => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Gradient with branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary-foreground)/0.08),transparent_50%)]" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
              <FileSearch className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">ApplyBotPro</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Land Your Dream Job<br />
            <span className="text-primary-foreground/80">Faster Than Ever</span>
          </h1>
          
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-md">
            AI-powered application analysis, interview prep, and job matching - 
            all in one powerful platform.
          </p>
          
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Smart Job Matching</p>
                <p className="text-sm text-primary-foreground/60">AI analyzes your fit for every role</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Interview Preparation</p>
                <p className="text-sm text-primary-foreground/60">Tailored questions based on your profile</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Application Briefing</p>
                <p className="text-sm text-primary-foreground/60">Optimize your resume for each job</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/50 to-transparent" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <FileSearch className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">ApplyBotPro</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your AI-powered job application assistant
            </p>
          </div>

          {/* Auth Form */}
          <div className="rounded-2xl border border-border p-8 bg-card shadow-xl">
            <h1 className="text-2xl font-bold mb-2">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {isRegister 
                ? "Start your journey to landing your dream job" 
                : "Sign in to continue to your dashboard"}
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  className="w-full h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <Input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  minLength={8}
                  className="w-full h-11"
                />
                {isRegister && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Must be at least 8 characters
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 font-medium">
                {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {isRegister ? (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Sign up for free
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered</span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
