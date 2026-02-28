import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FileSearch, Search, LayoutGrid, Send, ArrowRight,
  Sparkles, Target, Zap, Star, TrendingUp, Users,
  CheckCircle, Menu, X, Shield, Clock, Award, ChevronRight
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

/* ── Data ── */
const FEATURES = [
  {
    icon: FileSearch, num: "01", accent: "#2563EB",
    title: "CV Fit Analysis",
    desc: "Upload your CV against any job description and get an instant AI fit score — with strengths, gaps, and interview likelihood broken down clearly.",
    cta: "Analyze Your CV", link: "/analyze",
  },
  {
    icon: Search, num: "02", accent: "#7C3AED",
    title: "Smart Job Search",
    desc: "Search thousands of live listings filtered by role, location, experience level, and job type. Backed by AI matching, not keyword luck.",
    cta: "Search Jobs", link: "/search",
  },
  {
    icon: LayoutGrid, num: "03", accent: "#10B981",
    title: "Application Tracker",
    desc: "Every application, organised in a visual kanban board by fit score and status. Stay on top of your pipeline without spreadsheets.",
    cta: "View Board", link: "/board",
  },
  {
    icon: Send, num: "04", accent: "#F59E0B",
    title: "AI Apply Assistant",
    desc: "Get a tailored cover letter, application email, and ATS keyword tips — generated in seconds from your CV and the specific job you're applying to.",
    cta: "Start Applying", link: "/apply",
  },
];

const STEPS = [
  { n: "1", icon: FileSearch, title: "Upload Your CV", desc: "PDF or Word. Our AI parses your experience, skills, and background in seconds." },
  { n: "2", icon: Search, title: "Find a Job", desc: "Search our index or paste any job URL. We support listings from all major boards." },
  { n: "3", icon: TrendingUp, title: "Get Your Fit Score", desc: "Receive a detailed breakdown — strengths, gaps, red flags, and your odds of landing an interview." },
  { n: "4", icon: Send, title: "Apply with Confidence", desc: "AI writes your tailored email and cover letter, optimised for that exact role and company." },
];

const TESTIMONIALS = [
  { name: "Amara K.", role: "Software Engineer", color: "#2563EB", text: "I went from months of rejections to 3 interviews in 2 weeks. The fit score changed how I think about every application." },
  { name: "David O.", role: "Product Manager", color: "#7C3AED", text: "The CV tailoring is insanely precise. It found every keyword I was missing for each specific role — things I never would have noticed." },
  { name: "Priya N.", role: "UX Designer", color: "#10B981", text: "The kanban tracker made the whole job hunt feel manageable. I always knew exactly where I stood with every company." },
];

const BENEFITS = [
  { icon: Target, title: "Only Apply Where You Fit", desc: "Know your match score before you click submit. Stop wasting applications on long shots." },
  { icon: Clock, title: "10x Faster Applications", desc: "AI generates tailored emails and cover letters in seconds. Spend your energy where it matters." },
  { icon: Shield, title: "Beat the ATS Filter", desc: "Get keyword recommendations to pass automated screening before a human even sees your CV." },
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
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStatsStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  /* If logged in → go straight to app, else go to /login */
  const handleCTA = (dest = "/analyze") => {
    navigate(user ? dest : "/login");
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp {
          font-family: 'DM Sans', sans-serif;
          background: #FAFAF8;
          color: #0A0A0F;
          overflow-x: hidden;
          line-height: 1.6;
        }

        /* ══════════════════════════
           NAVBAR
        ══════════════════════════ */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 0 1.5rem;
          transition: background 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        .lp-nav.stuck {
          background: rgba(250,250,248,0.94);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.05);
        }
        .lp-nav-inner {
          max-width: 1160px; margin: 0 auto; height: 68px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }

        /* Logo */
        .lp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; cursor: pointer; }
        .lp-logo-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: #2563EB;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(37,99,235,0.35);
          flex-shrink: 0;
        }
        .lp-logo-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.05rem; color: #0A0A0F; letter-spacing: -0.01em; }

        /* Desktop nav links */
        .lp-nav-links { display: none; align-items: center; gap: 2px; }
        @media (min-width: 900px) { .lp-nav-links { display: flex; } }
        .lp-nav-a {
          padding: 8px 14px; border-radius: 8px;
          font-size: 14px; font-weight: 500; color: #4B5563;
          text-decoration: none; background: none; border: none;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .lp-nav-a:hover { color: #0A0A0F; background: rgba(0,0,0,0.04); }

        /* Nav CTAs */
        .lp-nav-ctas { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .lp-btn-ghost {
          display: none; padding: 9px 18px; border-radius: 9px;
          font-size: 13px; font-weight: 600; color: #374151;
          background: white; border: 1.5px solid rgba(0,0,0,0.12);
          text-decoration: none; transition: all 0.15s; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }
        @media (min-width: 540px) { .lp-btn-ghost { display: flex; align-items: center; } }
        .lp-btn-ghost:hover { border-color: rgba(0,0,0,0.25); background: #F3F4F6; }
        .lp-btn-solid {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 20px; border-radius: 9px;
          font-size: 13px; font-weight: 700; color: white;
          background: #2563EB; border: none; text-decoration: none;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3); transition: all 0.15s;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
        }
        .lp-btn-solid:hover { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }

        /* Hamburger */
        .lp-hamburger { display: flex; background: none; border: none; cursor: pointer; color: #0A0A0F; padding: 6px; border-radius: 8px; transition: background 0.15s; }
        .lp-hamburger:hover { background: rgba(0,0,0,0.05); }
        @media (min-width: 900px) { .lp-hamburger { display: none; } }

        /* Mobile drawer */
        .lp-drawer {
          position: fixed; inset: 0; z-index: 199;
          background: rgba(250,250,248,0.98); backdrop-filter: blur(20px);
          display: flex; flex-direction: column;
          padding: 84px 24px 40px; gap: 4px;
          animation: drawerIn 0.2s ease;
        }
        @keyframes drawerIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .lp-drawer-link {
          padding: 14px 16px; border-radius: 12px;
          font-size: 16px; font-weight: 600; color: #0A0A0F;
          background: none; border: none; text-align: left;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s;
        }
        .lp-drawer-link:hover { background: rgba(0,0,0,0.05); }
        .lp-drawer-divider { height: 1px; background: rgba(0,0,0,0.07); margin: 12px 0; }
        .lp-drawer-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 15px 20px; border-radius: 12px; font-size: 15px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; transition: all 0.15s;
          text-decoration: none;
        }

        /* ══════════════════════════
           HERO
        ══════════════════════════ */
        .lp-hero {
          position: relative; overflow: hidden;
          padding: 140px 1.5rem 100px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
        }

        /* Subtle grid */
        .lp-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 100%);
        }

        /* Soft ambient glow */
        .lp-hero-glow1 { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 65%); top: -200px; left: -200px; filter: blur(50px); pointer-events: none; animation: gFloat 10s ease-in-out infinite; }
        .lp-hero-glow2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%); bottom: -100px; right: -100px; filter: blur(40px); pointer-events: none; animation: gFloat 14s ease-in-out infinite reverse; }
        @keyframes gFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }

        /* Announcement bar */
        .lp-hero-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 999px;
          background: rgba(37,99,235,0.07); border: 1px solid rgba(37,99,235,0.18);
          font-size: 13px; font-weight: 600; color: #2563EB;
          margin-bottom: 28px; position: relative; z-index: 1;
          animation: fadeUp 0.5s ease both;
        }
        .lp-hero-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563EB; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }

        /* Title */
        .lp-hero-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.6rem, 6.5vw, 5rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.08;
          color: #0A0A0F;
          max-width: 820px;
          position: relative; z-index: 1;
          margin-bottom: 22px;
          animation: fadeUp 0.5s ease 0.08s both;
        }
        .lp-hero-h1 em {
          font-style: normal;
          background: linear-gradient(130deg, #2563EB 0%, #7C3AED 55%, #2563EB 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradShift 4s linear infinite;
        }
        @keyframes gradShift { to { background-position: 200% center; } }

        /* Subtitle */
        .lp-hero-sub {
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: #6B7280; font-weight: 300; line-height: 1.75;
          max-width: 560px; position: relative; z-index: 1;
          margin-bottom: 40px;
          animation: fadeUp 0.5s ease 0.15s both;
        }

        /* Hero CTAs */
        .lp-hero-ctas {
          display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;
          position: relative; z-index: 1; margin-bottom: 16px;
          animation: fadeUp 0.5s ease 0.22s both;
        }
        .lp-cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 32px; border-radius: 12px;
          font-size: 15px; font-weight: 700; color: white;
          background: #2563EB; border: none; cursor: pointer;
          box-shadow: 0 8px 28px rgba(37,99,235,0.35); transition: all 0.2s;
          font-family: 'DM Sans', sans-serif; text-decoration: none;
        }
        .lp-cta-primary:hover { background: #1D4ED8; transform: translateY(-2px); box-shadow: 0 12px 36px rgba(37,99,235,0.45); }
        .lp-cta-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 600; color: #374151;
          background: white; border: 1.5px solid rgba(0,0,0,0.12);
          cursor: pointer; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif; text-decoration: none;
        }
        .lp-cta-secondary:hover { border-color: rgba(0,0,0,0.25); background: #F9FAFB; transform: translateY(-1px); }

        /* Social proof nudge */
        .lp-hero-nudge {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #9CA3AF;
          position: relative; z-index: 1;
          animation: fadeUp 0.5s ease 0.28s both;
        }
        .lp-nudge-avatars { display: flex; }
        .lp-nudge-av {
          width: 28px; height: 28px; border-radius: 50%; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: white; margin-left: -8px;
        }
        .lp-nudge-av:first-child { margin-left: 0; }
        .lp-nudge-stars { display: flex; gap: 2px; color: #F59E0B; }

        /* App screenshot preview */
        .lp-hero-preview {
          position: relative; z-index: 1; width: 100%; max-width: 900px;
          margin-top: 56px;
          animation: fadeUp 0.6s ease 0.35s both;
        }
        .lp-preview-browser {
          background: white; border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 32px 80px rgba(37,99,235,0.1), 0 0 0 1px rgba(37,99,235,0.04);
          overflow: hidden;
        }
        .lp-preview-bar {
          background: #F5F5F7; border-bottom: 1px solid rgba(0,0,0,0.07);
          padding: 12px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .lp-dot { width: 11px; height: 11px; border-radius: 50%; }
        .lp-dot-r { background: #FF5F57; }
        .lp-dot-y { background: #FEBC2E; }
        .lp-dot-g { background: #28C840; }
        .lp-preview-url {
          flex: 1; margin: 0 12px; height: 26px;
          background: white; border-radius: 6px; border: 1px solid rgba(0,0,0,0.08);
          display: flex; align-items: center; padding: 0 10px; gap: 6px;
          font-size: 12px; color: #9CA3AF;
        }
        .lp-preview-body {
          display: grid; grid-template-columns: 190px 1fr; min-height: 320px;
        }
        @media (max-width: 640px) { .lp-preview-body { grid-template-columns: 1fr; } }
        .lp-preview-sidebar {
          background: #F8F9FB; border-right: 1px solid rgba(0,0,0,0.06);
          padding: 18px 10px; display: flex; flex-direction: column; gap: 3px;
        }
        @media (max-width: 640px) { .lp-preview-sidebar { display: none; } }
        .lp-pnav { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 8px; font-size: 13px; color: #9CA3AF; }
        .lp-pnav.on { background: rgba(37,99,235,0.08); color: #2563EB; font-weight: 600; }
        .lp-pnav-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: 0.6; }
        .lp-preview-content { padding: 22px; display: flex; flex-direction: column; gap: 14px; }
        .lp-preview-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #0A0A0F; }
        .lp-preview-score-row { display: flex; align-items: center; gap: 16px; }
        .lp-score-ring {
          width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
          background: conic-gradient(#2563EB 0deg 277deg, #E5E7EB 277deg);
          display: flex; align-items: center; justify-content: center; position: relative;
        }
        .lp-score-ring::after { content:''; width:58px; height:58px; background:white; border-radius:50%; position:absolute; }
        .lp-score-val { position:relative; z-index:1; font-family:'Syne',sans-serif; font-weight:800; font-size:17px; color:#2563EB; }
        .lp-ptag { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:600; }
        .lp-ptag-g { background:rgba(16,185,129,0.1); color:#059669; }
        .lp-ptag-b { background:rgba(37,99,235,0.1); color:#2563EB; }
        .lp-pbar-row { display:flex; align-items:center; gap:8px; font-size:12px; color:#6B7280; }
        .lp-pbar-track { flex:1; height:6px; background:#E5E7EB; border-radius:999px; overflow:hidden; }
        .lp-pbar-fill { height:100%; border-radius:999px; }
        .lp-pmini-row { display:flex; gap:10px; }
        .lp-pmini { flex:1; background:#F8F9FB; border:1px solid rgba(0,0,0,0.06); border-radius:10px; padding:10px; }
        .lp-pmini-lbl { font-size:11px; color:#9CA3AF; margin-bottom:3px; }
        .lp-pmini-val { font-family:'Syne',sans-serif; font-size:19px; font-weight:800; color:#0A0A0F; }

        /* Floating badges */
        .lp-float {
          position:absolute; background:white; border:1px solid rgba(0,0,0,0.08);
          border-radius:12px; padding:10px 14px; box-shadow:0 8px 28px rgba(0,0,0,0.1);
          display:flex; align-items:center; gap:10px; font-size:13px; font-weight:600;
          white-space:nowrap; z-index:10;
        }
        .lp-float-1 { top:30px; left:-50px; animation:flt1 4s ease-in-out infinite; }
        .lp-float-2 { bottom:40px; right:-40px; animation:flt2 5s ease-in-out infinite; }
        @keyframes flt1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes flt2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        .lp-float-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .lp-float-lbl { font-size:11px; color:#9CA3AF; font-weight:400; }
        .lp-float-val { font-family:'Syne',sans-serif; font-weight:800; color:#0A0A0F; font-size:14px; line-height:1; }
        @media (max-width: 700px) { .lp-float-1, .lp-float-2 { display:none; } }

        /* ══════════════════════════
           STATS BAR
        ══════════════════════════ */
        .lp-stats {
          background: #0A0A0F; padding: 52px 1.5rem; position: relative; overflow: hidden;
        }
        .lp-stats::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 60% 100% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%); }
        .lp-stats-inner { max-width: 900px; margin: 0 auto; position: relative; display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem; text-align: center; }
        .lp-stat-num { font-family:'Syne',sans-serif; font-size:clamp(2.2rem,5vw,3.5rem); font-weight:800; color:white; display:block; line-height:1; }
        .lp-stat-lbl { font-size:13px; color:rgba(255,255,255,0.45); margin-top:6px; letter-spacing:0.05em; text-transform:uppercase; }
        .lp-stats-divider { position:absolute; width:1px; background:rgba(255,255,255,0.08); top:15%; bottom:15%; }
        .lp-stats-d1 { left:33.33%; }
        .lp-stats-d2 { left:66.66%; }

        /* ══════════════════════════
           SECTION WRAPPER
        ══════════════════════════ */
        .lp-section { padding: 96px 1.5rem; max-width: 1160px; margin: 0 auto; }
        .lp-section-eyebrow { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#2563EB; margin-bottom:14px; }
        .lp-section-h2 { font-family:'Syne',sans-serif; font-size:clamp(1.75rem,4vw,2.75rem); font-weight:800; letter-spacing:-0.025em; color:#0A0A0F; margin-bottom:14px; line-height:1.12; }
        .lp-section-sub { font-size:1.05rem; color:#6B7280; font-weight:300; line-height:1.7; max-width:520px; }

        /* ══════════════════════════
           HOW IT WORKS
        ══════════════════════════ */
        .lp-steps-wrap { padding: 96px 1.5rem; background: #FAFAF8; }
        .lp-steps-inner { max-width: 1160px; margin: 0 auto; }
        .lp-steps-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:24px; margin-top:52px; }
        .lp-step {
          background:white; border:1px solid rgba(0,0,0,0.07); border-radius:20px;
          padding:28px 24px; position:relative; transition:all 0.25s;
        }
        .lp-step:hover { transform:translateY(-5px); box-shadow:0 16px 48px rgba(37,99,235,0.09); border-color:rgba(37,99,235,0.15); }
        .lp-step-num { font-family:'Syne',sans-serif; font-size:3.5rem; font-weight:800; color:rgba(37,99,235,0.07); line-height:1; margin-bottom:14px; transition:color 0.25s; }
        .lp-step:hover .lp-step-num { color:rgba(37,99,235,0.13); }
        .lp-step-icon-wrap { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; background:rgba(37,99,235,0.08); }
        .lp-step-title { font-family:'Syne',sans-serif; font-weight:700; font-size:1rem; color:#0A0A0F; margin-bottom:8px; }
        .lp-step-desc { font-size:14px; color:#6B7280; line-height:1.65; }

        /* connector */
        .lp-step-connector { display:none; }
        @media (min-width:900px) {
          .lp-steps-grid { grid-template-columns: repeat(4,1fr); gap:0; }
          .lp-step { border-radius:0; border-right:none; }
          .lp-step:first-child { border-radius:20px 0 0 20px; }
          .lp-step:last-child { border-radius:0 20px 20px 0; border-right:1px solid rgba(0,0,0,0.07); }
        }

        /* ══════════════════════════
           FEATURES
        ══════════════════════════ */
        .lp-features-outer { background:#0A0A0F; padding:96px 1.5rem; position:relative; overflow:hidden; }
        .lp-features-outer::before { content:''; position:absolute; width:700px; height:700px; border-radius:50%; background:radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%); top:-200px; right:-150px; pointer-events:none; }
        .lp-features-inner { max-width:1160px; margin:0 auto; position:relative; z-index:1; }
        .lp-features-outer .lp-section-eyebrow { color:rgba(255,255,255,0.5); }
        .lp-features-outer .lp-section-h2 { color:white; }
        .lp-features-outer .lp-section-sub { color:rgba(255,255,255,0.45); }
        .lp-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1px; margin-top:52px; background:rgba(255,255,255,0.06); border-radius:20px; overflow:hidden; }
        .lp-feat {
          background:#0A0A0F; padding:36px 32px;
          transition:background 0.25s; cursor:default; position:relative; overflow:hidden;
        }
        .lp-feat:hover { background:#12121A; }
        .lp-feat-num { font-family:'Syne',sans-serif; font-size:4rem; font-weight:800; color:rgba(255,255,255,0.04); line-height:1; position:absolute; top:16px; right:20px; transition:color 0.25s; }
        .lp-feat:hover .lp-feat-num { color:rgba(255,255,255,0.07); }
        .lp-feat-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:18px; }
        .lp-feat-title { font-family:'Syne',sans-serif; font-weight:700; font-size:1.05rem; color:white; margin-bottom:10px; }
        .lp-feat-desc { font-size:14px; color:rgba(255,255,255,0.45); line-height:1.65; margin-bottom:22px; }
        .lp-feat-cta { display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; text-decoration:none; transition:gap 0.2s; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .lp-feat-cta:hover { gap:10px; }

        /* ══════════════════════════
           BENEFITS (Why section)
        ══════════════════════════ */
        .lp-benefits-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:24px; margin-top:52px; }
        .lp-benefit { padding:28px; border-radius:18px; border:1px solid rgba(0,0,0,0.07); background:white; transition:all 0.25s; }
        .lp-benefit:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.07); }
        .lp-benefit-icon { width:44px; height:44px; border-radius:12px; background:rgba(37,99,235,0.08); display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
        .lp-benefit-title { font-family:'Syne',sans-serif; font-weight:700; font-size:1rem; color:#0A0A0F; margin-bottom:8px; }
        .lp-benefit-desc { font-size:14px; color:#6B7280; line-height:1.65; }

        /* ══════════════════════════
           TESTIMONIALS
        ══════════════════════════ */
        .lp-testi-outer { background:#F4F4F2; padding:96px 1.5rem; }
        .lp-testi-inner { max-width:1160px; margin:0 auto; }
        .lp-testi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; margin-top:52px; }
        .lp-testi {
          background:white; border:1px solid rgba(0,0,0,0.06); border-radius:20px;
          padding:28px; transition:all 0.25s;
        }
        .lp-testi:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.08); }
        .lp-testi-stars { display:flex; gap:3px; margin-bottom:14px; color:#F59E0B; }
        .lp-testi-text { font-size:15px; color:#374151; line-height:1.7; margin-bottom:20px; font-style:italic; }
        .lp-testi-author { display:flex; align-items:center; gap:12px; }
        .lp-testi-av { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-weight:800; font-size:14px; color:white; flex-shrink:0; }
        .lp-testi-name { font-weight:600; font-size:14px; color:#0A0A0F; }
        .lp-testi-role { font-size:12px; color:#9CA3AF; }

        /* ══════════════════════════
           CTA BANNER
        ══════════════════════════ */
        .lp-cta-outer { padding:60px 1.5rem 80px; }
        .lp-cta-banner {
          max-width:1100px; margin:0 auto;
          background:linear-gradient(130deg,#1E3A8A 0%,#2563EB 40%,#4F46E5 70%,#7C3AED 100%);
          border-radius:28px; padding:72px 56px; text-align:center;
          position:relative; overflow:hidden;
        }
        .lp-cta-banner::before { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:rgba(255,255,255,0.05); top:-200px; right:-100px; pointer-events:none; }
        .lp-cta-banner::after { content:''; position:absolute; width:300px; height:300px; border-radius:50%; background:rgba(255,255,255,0.04); bottom:-150px; left:-50px; pointer-events:none; }
        .lp-cta-eyebrow { display:inline-flex; align-items:center; gap:6px; padding:6px 16px; background:rgba(255,255,255,0.12); border-radius:999px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.9); margin-bottom:20px; }
        .lp-cta-h2 { font-family:'Syne',sans-serif; font-size:clamp(1.8rem,4.5vw,3.2rem); font-weight:800; color:white; letter-spacing:-0.025em; max-width:660px; margin:0 auto 16px; position:relative; line-height:1.1; }
        .lp-cta-sub { color:rgba(255,255,255,0.6); font-size:1rem; max-width:440px; margin:0 auto 36px; line-height:1.7; position:relative; font-weight:300; }
        .lp-cta-btns { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; position:relative; }
        .lp-cta-btn-w { display:inline-flex; align-items:center; gap:8px; padding:15px 32px; background:white; color:#1E3A8A; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; border:none; box-shadow:0 4px 20px rgba(0,0,0,0.18); transition:all 0.2s; text-decoration:none; }
        .lp-cta-btn-w:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.25); }
        .lp-cta-btn-g { display:inline-flex; align-items:center; gap:8px; padding:15px 28px; background:rgba(255,255,255,0.1); color:white; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; cursor:pointer; border:1.5px solid rgba(255,255,255,0.25); transition:all 0.2s; text-decoration:none; }
        .lp-cta-btn-g:hover { background:rgba(255,255,255,0.18); }
        @media (max-width:600px) { .lp-cta-banner { padding:48px 24px; } }

        /* ══════════════════════════
           FOOTER
        ══════════════════════════ */
        .lp-footer { background:#0A0A0F; padding:32px 1.5rem; }
        .lp-footer-inner { max-width:1160px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
        .lp-footer-logo { display:flex; align-items:center; gap:8px; text-decoration:none; }
        .lp-footer-logo span { font-family:'Syne',sans-serif; font-weight:700; font-size:14px; color:rgba(255,255,255,0.6); }
        .lp-footer-copy { font-size:13px; color:rgba(255,255,255,0.3); }
        .lp-footer-links { display:flex; gap:20px; }
        .lp-footer-link { font-size:13px; color:rgba(255,255,255,0.4); text-decoration:none; transition:color 0.15s; cursor:pointer; background:none; border:none; font-family:'DM Sans',sans-serif; }
        .lp-footer-link:hover { color:rgba(255,255,255,0.8); }

        /* ══════════════════════════
           UTILITIES
        ══════════════════════════ */
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .lp-fade { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className={`lp-nav${scrolled ? " stuck" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="lp-logo-mark"><FileSearch size={18} color="white" /></div>
            <span className="lp-logo-name">ApplyBotPro</span>
          </div>

          <div className="lp-nav-links">
            <button className="lp-nav-a" onClick={() => scrollTo("features")}>Features</button>
            <button className="lp-nav-a" onClick={() => scrollTo("how-it-works")}>How It Works</button>
            <button className="lp-nav-a" onClick={() => scrollTo("testimonials")}>Reviews</button>
            <button className="lp-nav-a" onClick={() => navigate("/pricing")}>Pricing</button>
          </div>

          <div className="lp-nav-ctas">
            {user ? (
              <button className="lp-btn-solid" onClick={() => navigate("/analyze")}>
                Go to Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Log in</button>
                <button className="lp-btn-solid" onClick={() => navigate("/register")}>
                  Get Started <ArrowRight size={14} />
                </button>
              </>
            )}
            <button className="lp-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {menuOpen && (
        <div className="lp-drawer">
          <button style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuOpen(false)}>
            <X size={24} color="#0A0A0F" />
          </button>
          <button className="lp-drawer-link" onClick={() => scrollTo("features")}>Features</button>
          <button className="lp-drawer-link" onClick={() => scrollTo("how-it-works")}>How It Works</button>
          <button className="lp-drawer-link" onClick={() => scrollTo("testimonials")}>Reviews</button>
          <button className="lp-drawer-link" onClick={() => { setMenuOpen(false); navigate("/pricing"); }}>Pricing</button>
          <div className="lp-drawer-divider" />
          {user ? (
            <button className="lp-drawer-cta" style={{ background: "#2563EB", color: "white" }} onClick={() => { setMenuOpen(false); navigate("/analyze"); }}>
              Go to Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button className="lp-drawer-cta" style={{ background: "white", color: "#0A0A0F", border: "1.5px solid rgba(0,0,0,0.12)" }} onClick={() => { setMenuOpen(false); navigate("/login"); }}>
                Log in
              </button>
              <button className="lp-drawer-cta" style={{ background: "#2563EB", color: "white", marginTop: 8 }} onClick={() => { setMenuOpen(false); navigate("/register"); }}>
                Create Free Account <ArrowRight size={16} />
              </button>
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
          <span className="lp-hero-pill-dot" />
          Powered by Gemini AI · Free to start
        </div>

        <h1 className="lp-hero-h1">
          The Smarter Way to<br />
          <em>Land Your Next Job</em>
        </h1>

        <p className="lp-hero-sub">
          Upload your CV, get an AI fit score, find matching jobs, prepare for interviews, and apply with tailored cover letters — all from one platform.
        </p>

        <div className="lp-hero-ctas">
          <button className="lp-cta-primary" onClick={() => handleCTA("/analyze")}>
            Analyze My CV Free <ArrowRight size={16} />
          </button>
          <button className="lp-cta-secondary" onClick={() => scrollTo("features")}>
            See how it works
          </button>
        </div>

        <div className="lp-hero-nudge">
          <div className="lp-nudge-avatars">
            {[["#2563EB","AK"],["#7C3AED","DO"],["#10B981","PN"]].map(([c,l]) => (
              <div key={l} className="lp-nudge-av" style={{ background: c }}>{l}</div>
            ))}
          </div>
          <div className="lp-nudge-stars">
            {[1,2,3,4,5].map(i => <Star key={i} size={13} fill="#F59E0B" />)}
          </div>
          <span>Loved by 1,200+ job seekers</span>
        </div>

        {/* Browser preview */}
        <div className="lp-hero-preview">
          <div className="lp-float lp-float-1">
            <div className="lp-float-icon" style={{ background: "rgba(16,185,129,0.1)" }}>
              <TrendingUp size={15} color="#10B981" />
            </div>
            <div>
              <div className="lp-float-lbl">Your Fit Score</div>
              <div className="lp-float-val">87%</div>
            </div>
          </div>
          <div className="lp-float lp-float-2">
            <div className="lp-float-icon" style={{ background: "rgba(245,158,11,0.1)" }}>
              <Award size={15} color="#F59E0B" />
            </div>
            <div>
              <div className="lp-float-lbl">Interview Likelihood</div>
              <div className="lp-float-val">High</div>
            </div>
          </div>

          <div className="lp-preview-browser">
            <div className="lp-preview-bar">
              <div className="lp-dot lp-dot-r" /><div className="lp-dot lp-dot-y" /><div className="lp-dot lp-dot-g" />
              <div className="lp-preview-url">
                <span style={{ width:6,height:6,borderRadius:"50%",background:"#10B981",display:"inline-block" }} />
                app.applybotpro.com/analyze
              </div>
            </div>
            <div className="lp-preview-body">
              <div className="lp-preview-sidebar">
                {[["Dashboard",false],["Analyze Fit",true],["Search Jobs",false],["Applications",false],["Interview Prep",false]].map(([l,a]) => (
                  <div key={l as string} className={`lp-pnav${a ? " on" : ""}`}>
                    <div className="lp-pnav-dot" />{l}
                  </div>
                ))}
              </div>
              <div className="lp-preview-content">
                <div className="lp-preview-title">Analysis Results</div>
                <div className="lp-preview-score-row">
                  <div className="lp-score-ring"><span className="lp-score-val">87%</span></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:"#0A0A0F",lineHeight:1 }}>Strong Match</div>
                    <div style={{ fontSize:13,color:"#6B7280",marginTop:4 }}>Senior Frontend Engineer · Acme Corp</div>
                    <div style={{ display:"flex",gap:8,marginTop:8 }}>
                      <span className="lp-ptag lp-ptag-g">High Interview Chance</span>
                      <span className="lp-ptag lp-ptag-b">React · TypeScript</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                  {[["Technical Skills",91,"#2563EB"],["Experience Match",84,"#7C3AED"],["Soft Skills",78,"#10B981"]].map(([l,p,c]) => (
                    <div key={l as string} className="lp-pbar-row">
                      <span style={{ width:110,textAlign:"right",fontSize:12 }}>{l}</span>
                      <div className="lp-pbar-track">
                        <div className="lp-pbar-fill" style={{ width:`${p}%`,background:c as string }} />
                      </div>
                      <span style={{ width:28,fontSize:12 }}>{p}%</span>
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
          <div className="lp-stats-divider lp-stats-d1" />
          <div className="lp-stats-divider lp-stats-d2" />
          <Stat value={85} suffix="%" label="CV Match Accuracy" started={statsStarted} />
          <Stat value={10} suffix="x" label="Faster Applications" started={statsStarted} />
          <Stat value={500} suffix="+" label="Jobs Indexed Daily" started={statsStarted} />
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="lp-steps-wrap" id="how-it-works">
        <div className="lp-steps-inner">
          <div className="lp-section-eyebrow"><Zap size={12} /> Process</div>
          <h2 className="lp-section-h2">From CV Upload to Interview<br />in 4 Simple Steps</h2>
          <p className="lp-section-sub">No complexity, no fluff. Upload your CV, find a job, get your score, and apply — all in minutes.</p>
          <div className="lp-steps-grid">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="lp-step">
                  <div className="lp-step-num">{s.n}</div>
                  <div className="lp-step-icon-wrap"><Icon size={20} color="#2563EB" /></div>
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="lp-features-outer" id="features">
        <div className="lp-features-inner">
          <div className="lp-section-eyebrow"><Sparkles size={12} /> Features</div>
          <h2 className="lp-section-h2">Everything You Need<br />to Land the Role</h2>
          <p className="lp-section-sub">Four AI-powered tools that cover the full job application lifecycle — from finding the role to walking in prepared.</p>
          <div className="lp-feat-grid">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.num} className="lp-feat">
                  <div className="lp-feat-num">{f.num}</div>
                  <div className="lp-feat-icon" style={{ background: `${f.accent}22` }}>
                    <Icon size={22} color={f.accent} />
                  </div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                  <button className="lp-feat-cta" style={{ color: f.accent }} onClick={() => handleCTA(f.link)}>
                    {f.cta} <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── WHY APPLYBOTPRO ── */}
      <div style={{ padding: "96px 1.5rem", background: "#FAFAF8" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="lp-section-eyebrow"><Target size={12} /> Why ApplyBotPro</div>
          <h2 className="lp-section-h2">Stop Guessing.<br />Start Getting Interviews.</h2>
          <p className="lp-section-sub">Most job seekers apply blindly and wonder why they get no callbacks. ApplyBotPro changes that.</p>
          <div className="lp-benefits-grid">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="lp-benefit">
                  <div className="lp-benefit-icon"><Icon size={22} color="#2563EB" /></div>
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
          <div className="lp-section-eyebrow"><Users size={12} /> Success Stories</div>
          <h2 className="lp-section-h2">Job Seekers Love It</h2>
          <p className="lp-section-sub">Real results from real people who used ApplyBotPro to get hired faster.</p>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="lp-testi">
                <div className="lp-testi-stars">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#F59E0B" />)}
                </div>
                <p className="lp-testi-text">"{t.text}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-av" style={{ background: t.color }}>
                    {t.name.split(" ").map(w=>w[0]).join("")}
                  </div>
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
          <div className="lp-cta-eyebrow"><Sparkles size={12} /> Free to start · No credit card</div>
          <h2 className="lp-cta-h2">Your Next Job Is One Upload Away</h2>
          <p className="lp-cta-sub">Stop wondering why you're not getting callbacks. Get the AI analysis that tells you exactly where you stand.</p>
          <div className="lp-cta-btns">
            <button className="lp-cta-btn-w" onClick={() => handleCTA("/analyze")}>
              Analyze My CV Free <ArrowRight size={16} />
            </button>
            <button className="lp-cta-btn-g" onClick={() => handleCTA("/search")}>
              <Search size={15} /> Browse Jobs
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <div className="lp-logo-mark" style={{ width:28,height:28,borderRadius:8 }}><FileSearch size={14} color="white" /></div>
            <span>ApplyBotPro</span>
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
