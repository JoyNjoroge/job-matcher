import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FileSearch, Search, LayoutGrid, Send, ArrowRight,
  Sparkles, Target, Zap, Star, TrendingUp, Users,
  CheckCircle, Shield, Clock, Award, ChevronRight, Menu, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ── Animated counter ── */
function useCounter(end: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration, start]);
  return count;
}

function Stat({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) {
  const n = useCounter(value, 1800, started);
  return (
    <div className="lp-stat">
      <div className="lp-stat-num">{n}{suffix}</div>
      <div className="lp-stat-lbl">{label}</div>
    </div>
  );
}

const FEATURES = [
  { icon: FileSearch, num: "01", accent: "#2563EB", title: "CV Fit Analysis", desc: "Upload your CV against any job and get an instant AI fit score — with strengths, gaps, and interview likelihood.", cta: "Analyze Your CV", link: "/analyze" },
  { icon: Search, num: "02", accent: "#7C3AED", title: "Smart Job Search", desc: "Search thousands of live listings filtered by role, location, and experience level. AI-powered, not keyword luck.", cta: "Search Jobs", link: "/search" },
  { icon: LayoutGrid, num: "03", accent: "#10B981", title: "Application Tracker", desc: "Every application in a visual kanban board sorted by fit score. No more spreadsheets.", cta: "View Board", link: "/board" },
  { icon: Send, num: "04", accent: "#F59E0B", title: "AI Apply Assistant", desc: "Tailored cover letter, email, and ATS keywords — generated in seconds from your CV and the specific role.", cta: "Start Applying", link: "/apply-briefing" },
];

const STEPS = [
  { n: "1", icon: FileSearch, title: "Upload Your CV", desc: "PDF or Word. Our AI parses your experience, skills, and background in seconds." },
  { n: "2", icon: Search, title: "Find a Job", desc: "Search our index or paste any job URL. We support all major boards." },
  { n: "3", icon: TrendingUp, title: "Get Your Fit Score", desc: "Strengths, gaps, red flags, and your odds of landing an interview — all broken down clearly." },
  { n: "4", icon: Send, title: "Apply with Confidence", desc: "AI writes your tailored email and cover letter, optimised for that exact role." },
];

const TESTIMONIALS = [
  { name: "Amara K.", role: "Software Engineer", color: "#2563EB", text: "I went from months of rejections to 3 interviews in 2 weeks. The fit score changed everything." },
  { name: "David O.", role: "Product Manager", color: "#7C3AED", text: "The CV tailoring is insanely precise. It found every keyword I was missing for each specific role." },
  { name: "Priya N.", role: "UX Designer", color: "#10B981", text: "The kanban tracker made the whole job hunt feel manageable. Always knew exactly where I stood." },
];

const BENEFITS = [
  { icon: Target, title: "Only Apply Where You Fit", desc: "Know your match score before you hit submit. Stop wasting applications on long shots." },
  { icon: Clock, title: "10x Faster Applications", desc: "AI generates tailored emails and cover letters in seconds, not hours." },
  { icon: Shield, title: "Beat the ATS Filter", desc: "Keyword recommendations to pass automated screening before a human sees your CV." },
  { icon: Award, title: "Walk Into Interviews Prepared", desc: "Role-specific interview questions generated from your actual CV and the job description." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const handleCTA = (dest = "/analyze") => navigate(user ? dest : "/login");
  const scrollTo = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <div className="lp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── CSS VARS ── */
        .lp { --accent: #2563EB; --accent2: #7C3AED; --accent3: #10B981; }

        .lp {
          font-family: 'DM Sans', sans-serif;
          background: #FAFAF8;
          color: #0A0A0F;
          overflow-x: hidden;
          line-height: 1.6;
        }

        /* ── NAVBAR ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 0 clamp(1rem, 3vw, 2.5rem);
          transition: background 0.3s, box-shadow 0.3s;
        }
        .lp-nav.stuck {
          background: rgba(250,250,248,0.95);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }
        .lp-nav-inner {
          max-width: 1140px; margin: 0 auto;
          height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .lp-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; cursor: pointer; flex-shrink: 0; }
        .lp-logo-mark {
          width: 34px; height: 34px; border-radius: 9px; background: #2563EB;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(37,99,235,0.3); flex-shrink: 0;
        }
        .lp-logo-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem; color: #0A0A0F; }

        .lp-nav-links { display: none; align-items: center; gap: 2px; }
        @media (min-width: 860px) { .lp-nav-links { display: flex; } }
        .lp-nav-a {
          padding: 7px 13px; border-radius: 8px;
          font-size: 13.5px; font-weight: 500; color: #4B5563;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .lp-nav-a:hover { color: #0A0A0F; background: rgba(0,0,0,0.04); }

        .lp-nav-ctas { display: flex; align-items: center; gap: 8px; }
        .lp-btn-ghost {
          display: none; padding: 8px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 600; color: #374151;
          background: white; border: 1.5px solid rgba(0,0,0,0.1);
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        @media (min-width: 540px) { .lp-btn-ghost { display: flex; align-items: center; } }
        .lp-btn-ghost:hover { border-color: rgba(0,0,0,0.2); }
        .lp-btn-solid {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 8px;
          font-size: 13px; font-weight: 700; color: white;
          background: #2563EB; border: none;
          box-shadow: 0 4px 12px rgba(37,99,235,0.28);
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .lp-btn-solid:hover { background: #1D4ED8; transform: translateY(-1px); }
        .lp-hamburger { display: flex; background: none; border: none; cursor: pointer; color: #0A0A0F; padding: 6px; border-radius: 8px; transition: background 0.15s; }
        .lp-hamburger:hover { background: rgba(0,0,0,0.05); }
        @media (min-width: 860px) { .lp-hamburger { display: none; } }

        /* Mobile drawer */
        .lp-drawer {
          position: fixed; inset: 0; z-index: 199;
          background: rgba(250,250,248,0.98); backdrop-filter: blur(20px);
          display: flex; flex-direction: column;
          padding: 80px 20px 32px; gap: 4px;
          animation: drawerIn 0.18s ease;
        }
        @keyframes drawerIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .lp-drawer-link {
          padding: 14px 16px; border-radius: 10px;
          font-size: 16px; font-weight: 600; color: #0A0A0F;
          background: none; border: none; text-align: left;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s;
        }
        .lp-drawer-link:hover { background: rgba(0,0,0,0.05); }
        .lp-drawer-divider { height: 1px; background: rgba(0,0,0,0.07); margin: 10px 0; }

        /* ── HERO ── */
        .lp-hero {
          position: relative; overflow: hidden;
          padding: clamp(100px, 14vw, 140px) clamp(1rem, 4vw, 2.5rem) clamp(60px, 8vw, 100px);
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .lp-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 75% 60% at 50% 30%, black 20%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 75% 60% at 50% 30%, black 20%, transparent 100%);
        }
        .lp-hero-glow1 { position: absolute; width: clamp(300px, 50vw, 600px); height: clamp(300px, 50vw, 600px); border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%); top: -30%; left: -15%; filter: blur(50px); pointer-events: none; animation: gFloat 10s ease-in-out infinite; }
        .lp-hero-glow2 { position: absolute; width: clamp(200px, 40vw, 450px); height: clamp(200px, 40vw, 450px); border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%); bottom: -10%; right: -10%; filter: blur(40px); pointer-events: none; animation: gFloat 14s ease-in-out infinite reverse; }
        @keyframes gFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-15px)} }

        .lp-hero-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px; border-radius: 999px;
          background: rgba(37,99,235,0.07); border: 1px solid rgba(37,99,235,0.16);
          font-size: 12px; font-weight: 600; color: #2563EB;
          margin-bottom: 24px; position: relative; z-index: 1;
          animation: fadeUp 0.5s ease both;
        }
        .lp-hero-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563EB; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .lp-hero-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 5.5vw, 4rem);
          font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
          color: #0A0A0F; max-width: 760px;
          position: relative; z-index: 1; margin-bottom: 20px;
          animation: fadeUp 0.5s ease 0.08s both;
        }
        .lp-hero-h1 em {
          font-style: normal;
          background: linear-gradient(130deg, #2563EB 0%, #7C3AED 60%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-hero-sub {
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          color: #6B7280; font-weight: 300; line-height: 1.75; max-width: 520px;
          position: relative; z-index: 1; margin-bottom: 36px;
          animation: fadeUp 0.5s ease 0.15s both;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        .lp-hero-ctas {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
          position: relative; z-index: 1; margin-bottom: 14px;
          animation: fadeUp 0.5s ease 0.22s both;
        }
        .lp-cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 10px; font-size: 14.5px; font-weight: 700; color: white;
          background: #2563EB; border: none; cursor: pointer;
          box-shadow: 0 6px 24px rgba(37,99,235,0.32); transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-cta-primary:hover { background: #1D4ED8; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(37,99,235,0.42); }
        .lp-cta-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px; border-radius: 10px; font-size: 14.5px; font-weight: 600; color: #374151;
          background: white; border: 1.5px solid rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-cta-secondary:hover { border-color: rgba(0,0,0,0.22); transform: translateY(-1px); }

        .lp-hero-nudge {
          display: flex; align-items: center; gap: 10px;
          font-size: 12.5px; color: #9CA3AF; position: relative; z-index: 1;
          animation: fadeUp 0.5s ease 0.28s both;
        }
        .lp-nudge-avatars { display: flex; }
        .lp-nudge-av {
          width: 26px; height: 26px; border-radius: 50%; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: white; margin-left: -7px;
        }
        .lp-nudge-av:first-child { margin-left: 0; }

        /* App preview */
        .lp-hero-preview {
          position: relative; z-index: 1; width: 100%; max-width: 840px;
          margin-top: 48px; animation: fadeUp 0.6s ease 0.35s both;
        }
        .lp-preview-browser {
          background: white; border-radius: 14px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 24px 64px rgba(37,99,235,0.08);
          overflow: hidden;
        }
        .lp-preview-bar {
          background: #F4F4F2; border-bottom: 1px solid rgba(0,0,0,0.07);
          padding: 10px 14px; display: flex; align-items: center; gap: 6px;
        }
        .lp-dot { width: 10px; height: 10px; border-radius: 50%; }
        .lp-dot-r { background: #FF5F57; } .lp-dot-y { background: #FEBC2E; } .lp-dot-g { background: #28C840; }
        .lp-preview-url {
          flex: 1; margin: 0 10px; height: 24px; background: white; border-radius: 5px;
          border: 1px solid rgba(0,0,0,0.07); display: flex; align-items: center; padding: 0 9px;
          font-size: 11px; color: #9CA3AF;
        }
        .lp-preview-body { display: grid; grid-template-columns: 170px 1fr; min-height: 280px; }
        @media (max-width: 560px) { .lp-preview-body { grid-template-columns: 1fr; } }
        .lp-preview-sidebar {
          background: #F7F8FA; border-right: 1px solid rgba(0,0,0,0.06);
          padding: 14px 8px; display: flex; flex-direction: column; gap: 3px;
        }
        @media (max-width: 560px) { .lp-preview-sidebar { display: none; } }
        .lp-pnav { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 7px; font-size: 12px; color: #9CA3AF; }
        .lp-pnav.on { background: rgba(37,99,235,0.08); color: #2563EB; font-weight: 600; }
        .lp-preview-content { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
        .lp-preview-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #0A0A0F; }
        .lp-score-ring {
          width: 70px; height: 70px; border-radius: 50%; flex-shrink: 0;
          background: conic-gradient(#2563EB 0deg 277deg, #E5E7EB 277deg);
          display: flex; align-items: center; justify-content: center; position: relative;
        }
        .lp-score-ring::after { content:''; width: 52px; height: 52px; background: white; border-radius: 50%; position: absolute; }
        .lp-score-val { position: relative; z-index: 1; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; color: #2563EB; }
        .lp-ptag { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 600; }
        .lp-ptag-g { background: rgba(16,185,129,0.1); color: #059669; }
        .lp-ptag-b { background: rgba(37,99,235,0.1); color: #2563EB; }
        .lp-pbar-row { display: flex; align-items: center; gap: 7px; font-size: 11px; color: #6B7280; }
        .lp-pbar-track { flex: 1; height: 5px; background: #E5E7EB; border-radius: 999px; overflow: hidden; }
        .lp-pbar-fill { height: 100%; border-radius: 999px; }
        .lp-pmini-row { display: flex; gap: 8px; }
        .lp-pmini { flex: 1; background: #F7F8FA; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 9px 10px; }
        .lp-pmini-lbl { font-size: 10px; color: #9CA3AF; margin-bottom: 2px; }
        .lp-pmini-val { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #0A0A0F; }

        /* ── STATS ── */
        .lp-stats { background: #0A0A0F; padding: clamp(28px, 5vw, 48px) clamp(1rem, 4vw, 2.5rem); }
        .lp-stats-inner {
          max-width: 720px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center; gap: 0;
          position: relative;
        }
        .lp-stat { flex: 1; text-align: center; padding: clamp(16px, 3vw, 24px) 16px; }
        .lp-stat-num { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; color: white; letter-spacing: -0.03em; line-height: 1; margin-bottom: 6px; }
        .lp-stat-lbl { font-size: clamp(11px, 2vw, 13px); color: rgba(255,255,255,0.45); font-weight: 400; }
        .lp-stats-divider { width: 1px; height: 50px; background: rgba(255,255,255,0.1); flex-shrink: 0; }

        /* ── SECTIONS ── */
        .lp-section-wrap { padding: clamp(60px, 8vw, 100px) clamp(1rem, 4vw, 2.5rem); }
        .lp-section-inner { max-width: 1080px; margin: 0 auto; }
        .lp-section-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: #2563EB; margin-bottom: 12px;
        }
        .lp-section-h2 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.7rem, 4vw, 2.6rem);
          font-weight: 800; letter-spacing: -0.028em; color: #0A0A0F; margin-bottom: 12px; line-height: 1.15;
        }
        .lp-section-sub { color: #6B7280; font-size: clamp(14px, 2vw, 15px); font-weight: 300; max-width: 520px; line-height: 1.7; margin-bottom: clamp(32px, 5vw, 52px); }

        /* HOW IT WORKS */
        .lp-steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .lp-step { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 24px; transition: all 0.2s; }
        .lp-step:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.08); }
        .lp-step-num { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; color: #2563EB; margin-bottom: 10px; }
        .lp-step-icon-wrap { width: 38px; height: 38px; border-radius: 10px; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .lp-step-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #0A0A0F; margin-bottom: 7px; }
        .lp-step-desc { font-size: 13px; color: #6B7280; line-height: 1.65; font-weight: 300; }

        /* FEATURES */
        .lp-feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
        .lp-feat { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 26px; display: flex; flex-direction: column; transition: all 0.22s; }
        .lp-feat:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.09); }
        .lp-feat-num { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #D1D5DB; margin-bottom: 14px; }
        .lp-feat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .lp-feat-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: #0A0A0F; margin-bottom: 9px; }
        .lp-feat-desc { font-size: 13.5px; color: #6B7280; line-height: 1.65; font-weight: 300; flex: 1; margin-bottom: 18px; }
        .lp-feat-cta { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 0; transition: gap 0.15s; }
        .lp-feat-cta:hover { gap: 8px; }

        /* BENEFITS */
        .lp-benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
        .lp-benefit { padding: 22px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.07); background: white; }
        .lp-benefit-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .lp-benefit-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14.5px; color: #0A0A0F; margin-bottom: 6px; }
        .lp-benefit-desc { font-size: 13px; color: #6B7280; line-height: 1.65; font-weight: 300; }

        /* TESTIMONIALS */
        .lp-testi-outer { background: #F2F2EF; padding: clamp(60px, 8vw, 96px) clamp(1rem, 4vw, 2.5rem); }
        .lp-testi-inner { max-width: 1080px; margin: 0 auto; }
        .lp-testi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
        .lp-testi { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 26px; }
        .lp-testi-stars { display: flex; gap: 2px; color: #F59E0B; margin-bottom: 12px; }
        .lp-testi-text { font-size: 14px; color: #374151; line-height: 1.7; font-style: italic; margin-bottom: 18px; }
        .lp-testi-author { display: flex; align-items: center; gap: 10px; }
        .lp-testi-av { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; }
        .lp-testi-name { font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 700; color: #0A0A0F; }
        .lp-testi-role { font-size: 12px; color: #9CA3AF; }

        /* CTA BANNER */
        .lp-cta-outer { padding: clamp(60px, 8vw, 96px) clamp(1rem, 4vw, 2.5rem); background: #FAFAF8; }
        .lp-cta-banner {
          max-width: 760px; margin: 0 auto; text-align: center;
          background: #0A0A0F; border-radius: 24px; padding: clamp(36px, 6vw, 60px) clamp(24px, 5vw, 60px);
          position: relative; overflow: hidden;
        }
        .lp-cta-banner::before {
          content: ''; position: absolute; width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%);
          top: -150px; right: -100px; filter: blur(40px); pointer-events: none;
        }
        .lp-cta-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #93C5FD; margin-bottom: 16px; }
        .lp-cta-h2 { font-family: 'Syne', sans-serif; font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800; letter-spacing: -0.025em; color: white; margin-bottom: 14px; line-height: 1.15; position: relative; z-index: 1; }
        .lp-cta-sub { color: rgba(255,255,255,0.5); font-size: clamp(13px, 2vw, 14.5px); font-weight: 300; line-height: 1.7; max-width: 480px; margin: 0 auto 32px; position: relative; z-index: 1; }
        .lp-cta-btns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; position: relative; z-index: 1; }
        .lp-cta-btn-w {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 26px; border-radius: 10px; font-size: 14px; font-weight: 700; color: #0A0A0F;
          background: white; border: none; cursor: pointer; transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-cta-btn-w:hover { background: #F3F4F6; transform: translateY(-1px); }
        .lp-cta-btn-g {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif;
        }
        .lp-cta-btn-g:hover { background: rgba(255,255,255,0.14); color: white; }

        /* FOOTER */
        .lp-footer { background: #0A0A0F; border-top: 1px solid rgba(255,255,255,0.05); padding: 28px clamp(1rem, 4vw, 2.5rem); }
        .lp-footer-inner {
          max-width: 1080px; margin: 0 auto;
          display: flex; align-items: center; flex-wrap: wrap; gap: 16px;
          justify-content: space-between;
        }
        .lp-footer-logo { display: flex; align-items: center; gap: 8px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
        .lp-footer-copy { font-size: 12.5px; color: rgba(255,255,255,0.3); }
        .lp-footer-links { display: flex; gap: 4px; }
        .lp-footer-link { background: none; border: none; cursor: pointer; font-size: 13px; color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif; padding: 6px 10px; border-radius: 7px; transition: color 0.15s; }
        .lp-footer-link:hover { color: rgba(255,255,255,0.8); }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className={`lp-nav${scrolled ? " stuck" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate("/")}>
            <div className="lp-logo-mark"><FileSearch size={16} color="white" /></div>
            <span className="lp-logo-name">ApplyBotPro</span>
          </div>

          <div className="lp-nav-links">
            <button className="lp-nav-a" onClick={() => scrollTo("features")}>Features</button>
            <button className="lp-nav-a" onClick={() => scrollTo("how-it-works")}>How It Works</button>
            <button className="lp-nav-a" onClick={() => scrollTo("testimonials")}>Stories</button>
            <button className="lp-nav-a" onClick={() => navigate("/pricing")}>Pricing</button>
          </div>

          <div className="lp-nav-ctas">
            {user ? (
              <button className="lp-btn-solid" onClick={() => navigate("/analyze")}>Dashboard <ArrowRight size={13} /></button>
            ) : (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
                <button className="lp-btn-solid" onClick={() => navigate("/register")}>Get started <ArrowRight size={13} /></button>
              </>
            )}
            <button className="lp-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="lp-drawer">
          <button className="lp-drawer-link" onClick={() => scrollTo("features")}>Features</button>
          <button className="lp-drawer-link" onClick={() => scrollTo("how-it-works")}>How It Works</button>
          <button className="lp-drawer-link" onClick={() => scrollTo("testimonials")}>Success Stories</button>
          <button className="lp-drawer-link" onClick={() => { setMenuOpen(false); navigate("/pricing"); }}>Pricing</button>
          <div className="lp-drawer-divider" />
          {user ? (
            <button className="lp-drawer-link" style={{ color: "#2563EB" }} onClick={() => { setMenuOpen(false); navigate("/analyze"); }}>Go to Dashboard →</button>
          ) : (
            <>
              <button className="lp-drawer-link" onClick={() => { setMenuOpen(false); navigate("/login"); }}>Sign in</button>
              <button className="lp-drawer-link" style={{ color: "#2563EB" }} onClick={() => { setMenuOpen(false); navigate("/register"); }}>Get started free →</button>
            </>
          )}
        </div>
      )}

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid" />
        <div className="lp-hero-glow1" />
        <div className="lp-hero-glow2" />

        <div className="lp-hero-pill">
          <div className="lp-hero-pill-dot" />
          AI-Powered Job Matching · Free to Start
        </div>

        <h1 className="lp-hero-h1">
          The Smarter Way to<br />
          <em>Land Your Next Job</em>
        </h1>
        <p className="lp-hero-sub">
          Upload your CV, get an instant AI fit score, and apply with tailored materials — all in one place.
        </p>

        <div className="lp-hero-ctas">
          <button className="lp-cta-primary" onClick={() => handleCTA("/analyze")}>
            Analyze My CV Free <ArrowRight size={15} />
          </button>
          <button className="lp-cta-secondary" onClick={() => handleCTA("/search")}>
            <Search size={15} /> Browse Jobs
          </button>
        </div>

        <div className="lp-hero-nudge">
          <div className="lp-nudge-avatars">
            {[["#2563EB","AK"],["#7C3AED","DO"],["#10B981","PN"]].map(([bg,ini]) => (
              <div key={ini} className="lp-nudge-av" style={{ background: bg }}>{ini}</div>
            ))}
          </div>
          <span>Trusted by 1,000+ job seekers</span>
        </div>

        {/* App preview */}
        <div className="lp-hero-preview">
          <div className="lp-preview-browser">
            <div className="lp-preview-bar">
              <div className="lp-dot lp-dot-r" /><div className="lp-dot lp-dot-y" /><div className="lp-dot lp-dot-g" />
              <div className="lp-preview-url"><FileSearch size={10} style={{ opacity: 0.5 }} /> applybotpro.com/analyze</div>
            </div>
            <div className="lp-preview-body">
              <div className="lp-preview-sidebar">
                {[["Analyze",true],["Search",false],["Board",false],["Applications",false],["Interview Prep",false]].map(([l,on]) => (
                  <div key={l as string} className={`lp-pnav${on ? " on" : ""}`}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.5 }} />
                    {l}
                  </div>
                ))}
              </div>
              <div className="lp-preview-content">
                <div className="lp-preview-title">CV Fit Analysis Results</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="lp-score-ring"><span className="lp-score-val">77%</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0F" }}>Senior Frontend Dev · Acme Corp</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <span className="lp-ptag lp-ptag-g">High Interview Chance</span>
                      <span className="lp-ptag lp-ptag-b">React · TypeScript</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[["Technical Skills",91,"#2563EB"],["Experience Match",84,"#7C3AED"],["Soft Skills",78,"#10B981"]].map(([l,p,c]) => (
                    <div key={l as string} className="lp-pbar-row">
                      <span style={{ width: 100, fontSize: 11 }}>{l}</span>
                      <div className="lp-pbar-track"><div className="lp-pbar-fill" style={{ width: `${p}%`, background: c as string }} /></div>
                      <span style={{ fontSize: 11 }}>{p}%</span>
                    </div>
                  ))}
                </div>
                <div className="lp-pmini-row">
                  {[["Strengths","8"],["Skill Gaps","2"],["Red Flags","0"]].map(([l,v]) => (
                    <div key={l} className="lp-pmini">
                      <div className="lp-pmini-lbl">{l}</div>
                      <div className="lp-pmini-val">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="lp-stats">
        <div className="lp-stats-inner" ref={statsRef}>
          <div className="lp-stats-divider" />
          <Stat value={85} suffix="%" label="CV Match Accuracy" started={statsStarted} />
          <div className="lp-stats-divider" />
          <Stat value={10} suffix="x" label="Faster Applications" started={statsStarted} />
          <div className="lp-stats-divider" />
          <Stat value={500} suffix="+" label="Jobs Indexed Daily" started={statsStarted} />
          <div className="lp-stats-divider" />
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="lp-section-wrap" id="how-it-works" style={{ background: "#F2F2EF" }}>
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow"><Zap size={11} /> Process</div>
          <h2 className="lp-section-h2">From CV Upload to Interview in 4 Simple Steps</h2>
          <p className="lp-section-sub">No complexity. Upload your CV, find a job, get your score, and apply — all in minutes.</p>
          <div className="lp-steps-grid">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="lp-step">
                  <div className="lp-step-num">STEP {s.n}</div>
                  <div className="lp-step-icon-wrap"><Icon size={18} color="#2563EB" /></div>
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="lp-section-wrap" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow"><Sparkles size={11} /> Features</div>
          <h2 className="lp-section-h2">Everything You Need to Land the Role</h2>
          <p className="lp-section-sub">Four AI-powered tools covering the full job application lifecycle.</p>
          <div className="lp-feat-grid">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.num} className="lp-feat">
                  <div className="lp-feat-num">{f.num}</div>
                  <div className="lp-feat-icon" style={{ background: `${f.accent}18` }}>
                    <Icon size={20} color={f.accent} />
                  </div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                  <button className="lp-feat-cta" style={{ color: f.accent }} onClick={() => handleCTA(f.link)}>
                    {f.cta} <ChevronRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── WHY ── */}
      <div className="lp-section-wrap" style={{ background: "#F2F2EF" }}>
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow"><Target size={11} /> Why ApplyBotPro</div>
          <h2 className="lp-section-h2">Stop Guessing. Start Getting Interviews.</h2>
          <p className="lp-section-sub">Most job seekers apply blindly. ApplyBotPro changes that.</p>
          <div className="lp-benefits-grid">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="lp-benefit">
                  <div className="lp-benefit-icon"><Icon size={20} color="#2563EB" /></div>
                  <div className="lp-benefit-title">{b.title}</div>
                  <div className="lp-benefit-desc">{b.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="lp-testi-outer" id="testimonials">
        <div className="lp-testi-inner">
          <div className="lp-section-eyebrow"><Users size={11} /> Success Stories</div>
          <h2 className="lp-section-h2">Job Seekers Love It</h2>
          <p className="lp-section-sub" style={{ marginBottom: "clamp(28px, 4vw, 44px)" }}>Real results from real people who got hired faster.</p>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="lp-testi">
                <div className="lp-testi-stars">{[1,2,3,4,5].map(i => <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />)}</div>
                <p className="lp-testi-text">"{t.text}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-av" style={{ background: t.color }}>{t.name.split(" ").map(w => w[0]).join("")}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div className="lp-cta-outer">
        <div className="lp-cta-banner">
          <div className="lp-cta-eyebrow"><Sparkles size={11} /> Free to start · No credit card</div>
          <h2 className="lp-cta-h2">Your Next Job Is One Upload Away</h2>
          <p className="lp-cta-sub">Stop wondering why you're not getting callbacks. Get the AI analysis that tells you exactly where you stand.</p>
          <div className="lp-cta-btns">
            <button className="lp-cta-btn-w" onClick={() => handleCTA("/analyze")}>Analyze My CV Free <ArrowRight size={14} /></button>
            <button className="lp-cta-btn-g" onClick={() => handleCTA("/search")}><Search size={14} /> Browse Jobs</button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}><FileSearch size={13} color="white" /></div>
            ApplyBotPro
          </div>
          <div className="lp-footer-copy">© {new Date().getFullYear()} ApplyBotPro. All rights reserved.</div>
          <div className="lp-footer-links">
            <button className="lp-footer-link" onClick={() => navigate("/pricing")}>Pricing</button>
            <button className="lp-footer-link" onClick={() => navigate("/login")}>Login</button>
            <button className="lp-footer-link" onClick={() => navigate("/register")}>Sign Up</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
