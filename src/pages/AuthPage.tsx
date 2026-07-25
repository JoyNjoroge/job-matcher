import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileSearch, Sparkles, Shield, Zap, Target, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/api";

type AuthMode = "login" | "register";

function handleGoogleAuth() {
  const redirectTo = encodeURIComponent(`${window.location.origin}/auth/callback`);
  window.location.href = `${API_BASE}/auth/google?redirect_to=${redirectTo}`;
}

function handleLinkedInAuth() {
  const redirectTo = encodeURIComponent(`${window.location.origin}/auth/callback`);
  window.location.href = `${API_BASE}/auth/linkedin?redirect_to=${redirectTo}`;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const AuthPage: React.FC<{ mode?: AuthMode }> = ({ mode = "login" }) => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "linkedin" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === "register";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .auth-root { min-height: 100vh; display: flex; font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatBlob { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px, -15px) scale(1.05); } }

        .auth-left { display: none; width: 48%; background: #0A0A0F; position: relative; overflow: hidden; flex-direction: column; justify-content: center; padding: 60px 56px; }
        @media (min-width: 1024px) { .auth-left { display: flex; } }
        .auth-left-blob1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%); top: -150px; right: -100px; filter: blur(40px); animation: floatBlob 10s ease-in-out infinite; pointer-events: none; }
        .auth-left-blob2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%); bottom: -100px; left: -100px; filter: blur(40px); animation: floatBlob 14s ease-in-out infinite reverse; pointer-events: none; }
        .auth-left-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }
        .auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 48px; }
        .auth-logo-icon { width: 42px; height: 42px; background: rgba(37,99,235,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .auth-logo-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; color: white; }
        .auth-left-title { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 3vw, 2.8rem); font-weight: 800; color: white; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 16px; }
        .auth-left-sub { color: rgba(255,255,255,0.5); font-size: 15px; font-weight: 300; line-height: 1.7; margin: 0 0 48px; max-width: 380px; }
        .auth-features { display: flex; flex-direction: column; gap: 16px; }
        .auth-feature { display: flex; align-items: flex-start; gap: 14px; }
        .auth-feature-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .auth-feature-title { font-weight: 600; font-size: 14px; color: white; margin: 0 0 3px; }
        .auth-feature-desc { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0; font-weight: 300; }
        .auth-left-bottom { position: absolute; bottom: 40px; left: 56px; display: flex; gap: 24px; }
        .auth-trust-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: rgba(255,255,255,0.35); }

        .auth-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; background: #FAFAF8; }
        .auth-form-wrap { width: 100%; max-width: 420px; }
        .auth-mobile-logo { display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 32px; }
        @media (min-width: 1024px) { .auth-mobile-logo { display: none; } }
        .auth-mobile-logo span { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; color: #0A0A0F; }

        .auth-card { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 24px; padding: 36px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); animation: fadeUp 0.5s ease; }
        .auth-card-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.02em; color: #0A0A0F; margin: 0 0 6px; }
        .auth-card-sub { font-size: 14px; color: #6B7280; font-weight: 300; margin: 0 0 24px; line-height: 1.5; }

        /* OAuth */
        .auth-oauth-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .auth-oauth-btn { width: 100%; height: 46px; border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: white; color: #374151; }
        .auth-oauth-btn:hover:not(:disabled) { background: #F9FAFB; border-color: rgba(0,0,0,0.2); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.07); }
        .auth-oauth-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .auth-oauth-btn.google:hover:not(:disabled) { border-color: rgba(66,133,244,0.4); box-shadow: 0 3px 12px rgba(66,133,244,0.12); }
        .auth-oauth-btn.linkedin:hover:not(:disabled) { border-color: rgba(10,102,194,0.4); box-shadow: 0 3px 12px rgba(10,102,194,0.12); }

        /* Divider */
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 0 0 20px; }
        .auth-divider-line { flex: 1; height: 1px; background: rgba(0,0,0,0.07); }
        .auth-divider-text { font-size: 12px; color: #9CA3AF; font-weight: 500; white-space: nowrap; }

        .auth-field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px; }
        .auth-input { width: 100%; height: 46px; padding: 0 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A0A0F; background: #F9FAFB; outline: none; transition: all 0.2s; }
        .auth-input:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .auth-field { margin-bottom: 16px; }
        .auth-hint { font-size: 12px; color: #9CA3AF; margin-top: 5px; }
        .auth-error { display: flex; gap: 10px; align-items: flex-start; background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #DC2626; margin-bottom: 16px; }
        .auth-submit { width: 100%; height: 48px; background: #2563EB; color: white; border: none; border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(37,99,235,0.3); }
        .auth-submit:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(37,99,235,0.4); }
        .auth-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .auth-switch { text-align: center; font-size: 14px; color: #6B7280; margin-top: 20px; }
        .auth-switch a { color: #2563EB; font-weight: 600; text-decoration: none; }
        .auth-switch a:hover { text-decoration: underline; }
        .auth-terms { text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 16px; }
        .auth-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        .auth-spinner-dark { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.12); border-top-color: #6B7280; border-radius: 50%; animation: spin 0.7s linear infinite; }
      `}</style>

      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-grid" />
        <div className="auth-left-blob1" />
        <div className="auth-left-blob2" />
        <div className="auth-logo" style={{ position: "relative", zIndex: 1 }}>
          <div className="auth-logo-icon"><FileSearch size={20} color="#93C5FD" /></div>
          <span className="auth-logo-name">CandorApply</span>
        </div>
        <h1 className="auth-left-title" style={{ position: "relative", zIndex: 1 }}>
          Apply thoughtfully.<br />Move faster.
        </h1>
        <p className="auth-left-sub" style={{ position: "relative", zIndex: 1 }}>
          Keep your experience accurate, review every answer, and spend less time repeating yourself.
        </p>
        <div className="auth-features" style={{ position: "relative", zIndex: 1 }}>
          {[
            { icon: Target, title: "Evidence-based matching", desc: "Compare the role against your real experience" },
            { icon: Sparkles, title: "Review before filling", desc: "Uncertain answers stay visible and editable" },
            { icon: Zap, title: "One reliable profile", desc: "Reuse your facts without generic applications" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="auth-feature">
                <div className="auth-feature-icon"><Icon size={18} color="rgba(255,255,255,0.7)" /></div>
                <div>
                  <p className="auth-feature-title">{f.title}</p>
                  <p className="auth-feature-desc">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="auth-left-bottom">
          <div className="auth-trust-item"><Shield size={14} /> Secure & Private</div>
          <div className="auth-trust-item"><CheckCircle size={14} /> Free to Start</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <FileSearch size={24} color="#2563EB" />
            <span>CandorApply</span>
          </div>

          <div className="auth-card">
            <h1 className="auth-card-title">
              {isRegister ? "Create account" : "Welcome back"}
            </h1>
            <p className="auth-card-sub">
              {isRegister
                ? "Start your journey to landing your dream job"
                : "Sign in to continue to your dashboard"}
            </p>

            {/* OAuth Buttons */}
            <div className="auth-oauth-group">
              <button
                type="button"
                className="auth-oauth-btn google"
                onClick={() => { setOauthLoading("google"); handleGoogleAuth(); }}
                disabled={!!oauthLoading || loading}
              >
                {oauthLoading === "google" ? <div className="auth-spinner-dark" /> : <GoogleIcon />}
                {isRegister ? "Sign up with Google" : "Continue with Google"}
              </button>

              <button
                type="button"
                className="auth-oauth-btn linkedin"
                onClick={() => { setOauthLoading("linkedin"); handleLinkedInAuth(); }}
                disabled={!!oauthLoading || loading}
              >
                {oauthLoading === "linkedin" ? <div className="auth-spinner-dark" /> : <LinkedInIcon />}
                {isRegister ? "Sign up with LinkedIn" : "Continue with LinkedIn"}
              </button>
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with email</span>
              <div className="auth-divider-line" />
            </div>

            {/* Email / Password */}
            <form onSubmit={onSubmit}>
              <div className="auth-field">
                <label className="auth-field-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-field-label">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={8}
                />
                {isRegister && <p className="auth-hint">Must be at least 8 characters</p>}
              </div>

              {error && (
                <div className="auth-error">
                  <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                  {error}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading || !!oauthLoading}>
                {loading
                  ? <><div className="auth-spinner" /> Please wait…</>
                  : <>{isRegister ? "Create account" : "Sign in"} <ArrowRight size={16} /></>
                }
              </button>
            </form>

            <div className="auth-switch">
              {isRegister
                ? <>Already have an account? <Link to="/login">Sign in</Link></>
                : <>Don't have an account? <Link to="/register">Sign up free</Link></>
              }
            </div>
          </div>

          <p className="auth-terms">By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
