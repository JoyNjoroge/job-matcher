import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileSearch } from "lucide-react";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <FileSearch className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ApplybotPro</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Your AI-powered job application assistant
          </p>
        </div>

        {/* Auth Form */}
        <div className="rounded-lg border border-border p-8 bg-card shadow-lg">
          <h1 className="text-2xl font-semibold mb-2">
            {isRegister ? "Create account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isRegister 
              ? "Sign up to start tracking your job applications" 
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
                className="w-full"
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
                className="w-full"
              />
              {isRegister && (
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
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
                  Sign up
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
