/**
 * AuthPage.tsx — Fixed version with dark mode support, correct sizing, mobile-first
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileSearch, Sparkles, Shield, Zap, Target, ArrowRight, CheckCircle } from "lucide-react";
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
      if (isRegister) await register(email, password);
      else await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .auth-root {
          min-height: 100vh; display: flex;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          background: var(--bg, #FAFAF8);
          color: var(--text, #0A0A0F);
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatBlob { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(16px, -12px) scale(1.04); } }

        /* ── LEFT PANEL ── */
        .auth-left {
          display: none; width: 46%;
          background: #0A0A0F;
          position: relative; overflow: hidden;
          flex-direction: column; justify-content: center;
          padding: clamp(40px, 5vw, 60px) clamp(36px, 5vw, 56px);
        }
        @media (min-width: 1024px) { .auth-left { display: flex; } }

        .auth-left-blob1 { position: absolute; width: clamp(300px, 40vw, 480px); height: clamp(300px, 40vw, 480px); border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%); top: -30%; right: -15%; filter: blur(40px); animation: floatBlob 10s ease-in-out infinite; pointer-events: none; }
        .auth-left-blob2 { position: absolute; width: clamp(240px, 35vw, 380px); height: clamp(240px, 35vw, 380px); border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%); bottom: -15%; left: -10%; filter: blur(40px); animation: floatBlob 14s ease-in-out infinite reverse; pointer-events: none; }
        .auth-left-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }

        .auth-logo { display: flex; align-items: center; gap: 9px; margin-bottom: 44px; }
        .auth-logo-icon { width: 38px; height: 38px; background: rgba(37,99,235,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .auth-logo-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.15rem; color: white; }

        .auth-left-title { font-family: 'Syne', sans-serif; font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 800; color: white; letter-spacing: -0.03em; line-height: 1.12; margin: 0 0 14px; }
        .auth-left-sub { color: rgba(255,255,255,0.45); font-size: clamp(13px, 1.5vw, 14.5px); font-weight: 300; line-height: 1.7; margin: 0 0 40px; max-width: 360px; }

        .auth-features { display: flex; flex-direction: column; gap: 14px; }
        .auth-feature { display: flex; align-items: flex-start; gap: 12px; }
        .auth-feature-icon { width: 36px; height: 36px; border-radius: 9px; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .auth-feature-title { font-weight: 600; font-size: 13.5px; color: white; margin: 0 0 2px; }
        .auth-feature-desc { font-size: 12.5px; color: rgba(255,255,255,0.38); margin: 0; font-weight: 300; }

        .auth-left-bottom { position: absolute; bottom: 32px; left: clamp(36px, 5vw, 56px); display: flex; gap: 20px; }
        .auth-trust-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.3); }

        /* ── RIGHT PANEL ── */
        .auth-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: clamp(28px, 5vw, 48px) clamp(16px, 5vw, 32px);
          background: var(--bg, #FAFAF8);
        }
        .auth-form-wrap { width: 100%; max-width: 400px; }

        /* Mobile logo */
        .auth-mobile-logo {
          display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 28px;
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text, #0A0A0F);
        }
        @media (min-width: 1024px) { .auth-mobile-logo { display: none; } }

        /* Form card */
        .auth-card {
          background: var(--surface, white);
          border: 1px solid var(--border, rgba(0,0,0,0.07));
          border-radius: 20px; padding: clamp(24px, 4vw, 36px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          animation: fadeUp 0.4s ease;
        }
        .auth-card-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.4rem; letter-spacing: -0.02em; color: var(--text, #0A0A0F); margin: 0 0 5px; }
        .auth-card-sub { font-size: 13.5px; color: var(--text2, #6B7280); font-weight: 300; margin: 0 0 24px; line-height: 1.5; }

        .auth-field-label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text, #374151); margin-bottom: 6px; }
        .auth-input {
          width: 100%; height: 44px; padding: 0 13px;
          border: 1.5px solid var(--border, rgba(0,0,0,0.1));
          border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 14px;
          color: var(--text, #0A0A0F); background: var(--surface2, #F9FAFB);
          outline: none; transition: all 0.2s;
        }
        .auth-input:focus {
          border-color: #2563EB;
          background: var(--surface, white);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .auth-field { margin-bottom: 16px; }
        .auth-hint { font-size: 11.5px; color: var(--text3, #9CA3AF); margin-top: 5px; }

        .auth-error {
          display: flex; gap: 9px; align-items: flex-start;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 9px; padding: 11px 13px; font-size: 13px; color: #DC2626; margin-bottom: 16px;
        }

        .auth-submit {
          width: 100%; height: 46px; background: #2563EB; color: white;
          border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-size: 14.5px; font-weight: 700; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 5px 18px rgba(37,99,235,0.28);
        }
        .auth-submit:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 7px 24px rgba(37,99,235,0.38); }
        .auth-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        .auth-switch { text-align: center; font-size: 13.5px; color: var(--text2, #6B7280); margin-top: 18px; }
        .auth-switch a { color: #2563EB; font-weight: 600; text-decoration: none; }
        .auth-switch a:hover { text-decoration: underline; }

        .auth-terms { text-align: center; font-size: 11.5px; color: var(--text3, #9CA3AF); margin-top: 14px; }

        .auth-spinner { width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
      `}</style>

      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-grid" />
        <div className="auth-left-blob1" />
        <div className="auth-left-blob2" />

        <div className="auth-logo" style={{ position: "relative", zIndex: 1 }}>
          <div className="auth-logo-icon"><FileSearch size={18} color="#93C5FD" /></div>
          <span className="auth-logo-name">ApplyBotPro</span>
        </div>

        <h1 className="auth-left-title" style={{ position: "relative", zIndex: 1 }}>
          Land Your<br />Dream Job<br />Faster
        </h1>
        <p className="auth-left-sub" style={{ position: "relative", zIndex: 1 }}>
          AI-powered fit analysis, interview prep, and tailored applications — all in one place.
        </p>

        <div className="auth-features" style={{ position: "relative", zIndex: 1 }}>
          {[
            { icon: Target,   title: "Smart Job Matching",     desc: "Instant AI fit score for every role" },
            { icon: Sparkles, title: "Interview Preparation",  desc: "Tailored questions based on your profile" },
            { icon: Zap,      title: "Application Briefing",   desc: "Optimize your resume for each job" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="auth-feature">
                <div className="auth-feature-icon"><Icon size={16} color="rgba(255,255,255,0.65)" /></div>
                <div>
                  <p className="auth-feature-title">{f.title}</p>
                  <p className="auth-feature-desc">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="auth-left-bottom">
          <div className="auth-trust-item"><Shield size={13} /> Secure &amp; Private</div>
          <div className="auth-trust-item"><CheckCircle size={13} /> Free to Start</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSearch size={16} color="white" />
            </div>
            ApplyBotPro
          </div>

          <div className="auth-card">
            <h1 className="auth-card-title">
              {isRegister ? "Create account" : "Welcome back"}
            </h1>
            <p className="auth-card-sub">
              {isRegister ? "Start your journey to landing your dream job" : "Sign in to continue to your dashboard"}
            </p>

            <form onSubmit={onSubmit}>
              <div className="auth-field">
                <label className="auth-field-label">Email</label>
                <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
              </div>
              <div className="auth-field">
                <label className="auth-field-label">Password</label>
                <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} autoComplete={isRegister ? "new-password" : "current-password"} />
                {isRegister && <p className="auth-hint">Must be at least 8 characters</p>}
              </div>

              {error && (
                <div className="auth-error">
                  <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                  {error}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <><div className="auth-spinner" /> Please wait…</>
                  : <>{isRegister ? "Create account" : "Sign in"} <ArrowRight size={15} /></>
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
