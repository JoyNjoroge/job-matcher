import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FileSearch, Sparkles, Target, Zap, Send,
  ArrowRight, Star, ChevronRight, Menu, X,
  Puzzle, Brain, FileText, Users, TrendingUp, CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ── Animated counter ── */
function useCounter(end: number, duration = 2000, start = false) {
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
  const n = useCounter(value, 2000, started);
  return (
    <div className="h-stat">
      <div className="h-stat-val">{n.toLocaleString()}{suffix}</div>
      <div className="h-stat-lbl">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Brain,
    tag: "AI Matching",
    title: "Jobs matched to your actual CV",
    desc: "Upload once. Get a curated feed of roles you're genuinely qualified for — ranked by fit score, not recency.",
    cta: "See My Matches",
    link: "/jobs/recommend",
    accent: "#6366F1",
    bg: "rgba(99,102,241,0.08)",
  },
  {
    icon: FileText,
    tag: "Resume AI",
    title: "Tailored CV in 6 seconds",
    desc: "Paste a job description. Get a rewritten CV that passes ATS and highlights exactly what the hiring manager wants.",
    cta: "Tailor My CV",
    link: "/cv-generator",
    accent: "#10B981",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    icon: Send,
    tag: "Apply Briefing",
    title: "Cover letter & email — done",
    desc: "AI writes your tailored application materials in seconds. Keyword-optimised for the exact role.",
    cta: "Generate Briefing",
    link: "/apply-briefing",
    accent: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    icon: Target,
    tag: "Fit Analysis",
    title: "Know your odds before you apply",
    desc: "Instant fit score with strengths, skill gaps, red flags, and interview likelihood — all clearly broken down.",
    cta: "Analyze Now",
    link: "/analyze",
    accent: "#EC4899",
    bg: "rgba(236,72,153,0.08)",
  },
];

const STEPS = [
  { n: "01", icon: FileSearch, title: "Upload your CV", desc: "PDF or Word. Parsed in seconds. Done once." },
  { n: "02", icon: Brain, title: "Get matched jobs", desc: "AI scans your skills and surfaces the right roles." },
  { n: "03", icon: TrendingUp, title: "See your fit score", desc: "Know exactly where you stand before applying." },
  { n: "04", icon: Send, title: "Apply in one click", desc: "Auto-written cover letter, email & ATS keywords." },
];

const TESTIMONIALS = [
  { name: "Amara K.", role: "Software Engineer", init: "AK", text: "Went from months of rejections to 3 interviews in 2 weeks. The fit score changed everything for me." },
  { name: "David O.", role: "Product Manager", init: "DO", text: "The CV tailoring is insanely precise. It caught every keyword I was missing for each specific role." },
  { name: "Priya N.", role: "UX Designer", init: "PN", text: "The kanban tracker made the whole job hunt feel manageable. Always knew exactly where I stood." },
  { name: "Kwame A.", role: "Data Analyst", init: "KA", text: "I love that it tells me NOT to apply to jobs I'm underqualified for. Saved me so much wasted effort." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

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

  // Auto-rotate features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const go = (dest: string) => navigate(user ? dest : "/login");

  return (
    <div className="h-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Satoshi:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .h-root {
          font-family: 'Satoshi', 'DM Sans', sans-serif;
          background: #0C0C10;
          color: #F0EEE8;
          overflow-x: hidden;
          line-height: 1.6;
        }

        /* ── NOISE TEXTURE ── */
        .h-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        /* ── NAVBAR ── */
        .h-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 0 clamp(1.25rem, 4vw, 3rem);
          transition: background 0.3s, border-color 0.3s;
        }
        .h-nav.stuck {
          background: rgba(12,12,16,0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .h-nav-inner {
          max-width: 1200px; margin: 0 auto;
          height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .h-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; cursor: pointer; flex-shrink: 0;
        }
        .h-logo-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(99,102,241,0.4);
        }
        .h-logo-name {
          font-family: 'Cabinet Grotesk', 'Syne', sans-serif;
          font-weight: 900; font-size: 1.05rem; color: #F0EEE8;
          letter-spacing: -0.01em;
        }
        .h-nav-links { display: none; align-items: center; gap: 4px; }
        @media (min-width: 860px) { .h-nav-links { display: flex; } }
        .h-nav-a {
          padding: 7px 14px; border-radius: 8px;
          font-size: 13.5px; font-weight: 500; color: rgba(240,238,232,0.55);
          background: none; border: none; cursor: pointer;
          font-family: 'Satoshi', sans-serif; transition: all 0.15s;
        }
        .h-nav-a:hover { color: #F0EEE8; background: rgba(255,255,255,0.06); }
        .h-nav-ctas { display: flex; align-items: center; gap: 10px; }
        .h-nav-ghost {
          display: none; padding: 8px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 600; color: rgba(240,238,232,0.7);
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer; font-family: 'Satoshi', sans-serif; transition: all 0.15s;
        }
        @media (min-width: 600px) { .h-nav-ghost { display: flex; align-items: center; } }
        .h-nav-ghost:hover { color: #F0EEE8; background: rgba(255,255,255,0.1); }
        .h-nav-solid {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 20px; border-radius: 9px;
          font-size: 13px; font-weight: 700; color: #0C0C10;
          background: #F0EEE8; border: none; cursor: pointer;
          font-family: 'Satoshi', sans-serif; transition: all 0.15s;
        }
        .h-nav-solid:hover { background: white; transform: translateY(-1px); }
        .h-hamburger {
          display: flex; background: none; border: none; cursor: pointer;
          color: #F0EEE8; padding: 6px; border-radius: 8px; transition: background 0.15s;
        }
        .h-hamburger:hover { background: rgba(255,255,255,0.08); }
        @media (min-width: 860px) { .h-hamburger { display: none; } }

        /* Mobile menu */
        .h-mobile-menu {
          position: fixed; inset: 0; z-index: 190; background: #0C0C10;
          display: flex; flex-direction: column; padding: 80px 2rem 2rem;
          gap: 8px; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .h-mobile-menu.open { transform: translateX(0); }
        .h-mobile-a {
          padding: 14px 16px; border-radius: 10px; font-size: 16px;
          font-weight: 600; color: rgba(240,238,232,0.7); background: none; border: none;
          cursor: pointer; text-align: left; font-family: 'Satoshi', sans-serif;
          transition: all 0.15s;
        }
        .h-mobile-a:hover { color: #F0EEE8; background: rgba(255,255,255,0.06); }

        /* ── HERO ── */
        .h-hero {
          position: relative; min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 120px clamp(1.25rem, 4vw, 3rem) 80px;
          text-align: center; overflow: hidden;
        }
        .h-hero-glow {
          position: absolute; pointer-events: none;
          border-radius: 50%; filter: blur(80px); opacity: 0.35;
        }
        .h-hero-glow1 {
          width: 600px; height: 600px; top: -100px; left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%);
          animation: glowPulse 8s ease-in-out infinite;
        }
        .h-hero-glow2 {
          width: 400px; height: 400px; bottom: 0; right: -100px;
          background: radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%);
          animation: glowPulse 10s ease-in-out infinite reverse;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.5; transform: translateX(-50%) scale(1.1); }
        }
        .h-hero-glow2 { animation-name: glowPulse2; }
        @keyframes glowPulse2 {
          0%, 100% { opacity: 0.25; } 50% { opacity: 0.45; }
        }

        .h-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 100px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
          font-size: 12.5px; font-weight: 600; color: #A5B4FC;
          margin-bottom: 28px; letter-spacing: 0.02em;
          animation: fadeUp 0.5s ease both;
        }
        .h-hero-badge-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #6366F1;
          box-shadow: 0 0 8px rgba(99,102,241,0.8);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        .h-hero-h1 {
          font-family: 'Cabinet Grotesk', 'Syne', sans-serif;
          font-size: clamp(2.6rem, 6.5vw, 5rem);
          font-weight: 900; letter-spacing: -0.04em; line-height: 1.0;
          color: #F0EEE8; max-width: 780px;
          margin: 0 auto 22px;
          animation: fadeUp 0.5s 0.1s ease both;
        }
        .h-hero-accent {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .h-hero-sub {
          font-size: clamp(1rem, 2vw, 1.2rem); font-weight: 400;
          color: rgba(240,238,232,0.5); max-width: 540px;
          margin: 0 auto 40px; line-height: 1.7;
          animation: fadeUp 0.5s 0.2s ease both;
        }
        .h-hero-ctas {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
          gap: 12px; margin-bottom: 48px;
          animation: fadeUp 0.5s 0.3s ease both;
        }
        .h-btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 700; color: white;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          border: none; cursor: pointer; font-family: 'Satoshi', sans-serif;
          box-shadow: 0 8px 32px rgba(99,102,241,0.4);
          transition: all 0.2s;
        }
        .h-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99,102,241,0.5); }
        .h-btn-secondary {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 26px; border-radius: 12px;
          font-size: 15px; font-weight: 600; color: rgba(240,238,232,0.8);
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer; font-family: 'Satoshi', sans-serif; transition: all 0.2s;
        }
        .h-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #F0EEE8; transform: translateY(-1px); }

        /* Extension banner */
        .h-ext-bar {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 10px 18px; border-radius: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          font-size: 13px; color: rgba(240,238,232,0.5); cursor: pointer;
          transition: all 0.2s; animation: fadeUp 0.5s 0.4s ease both;
        }
        .h-ext-bar:hover { background: rgba(255,255,255,0.08); color: rgba(240,238,232,0.8); border-color: rgba(255,255,255,0.15); }
        .h-ext-bar-pill {
          padding: 3px 9px; border-radius: 100px; background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.3); font-size: 11px; font-weight: 700;
          color: #34D399; letter-spacing: 0.04em;
        }

        /* Hero UI mockup */
        .h-hero-ui {
          position: relative; max-width: 860px; width: 100%;
          margin: 56px auto 0; border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
          animation: fadeUp 0.6s 0.5s ease both;
        }
        .h-ui-bar {
          height: 40px; background: rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; padding: 0 16px; gap: 6px;
        }
        .h-ui-dot { width: 10px; height: 10px; border-radius: 50%; }
        .h-ui-body {
          padding: clamp(16px, 3vw, 28px);
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        @media (max-width: 640px) { .h-ui-body { grid-template-columns: 1fr; } }
        .h-ui-card {
          background: rgba(255,255,255,0.04); border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07); padding: 16px;
        }
        .h-ui-card-label { font-size: 11px; font-weight: 600; color: rgba(240,238,232,0.35); letter-spacing: 0.06em; margin-bottom: 10px; }
        .h-ui-job { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .h-ui-job:last-child { border-bottom: none; padding-bottom: 0; }
        .h-ui-job-logo { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
        .h-ui-job-title { font-size: 12.5px; font-weight: 600; color: rgba(240,238,232,0.9); line-height: 1.3; }
        .h-ui-job-co { font-size: 11px; color: rgba(240,238,232,0.4); margin-top: 2px; }
        .h-ui-badge { display: inline-flex; padding: 3px 8px; border-radius: 100px; font-size: 10.5px; font-weight: 700; margin-top: 4px; }
        .h-ui-score { font-size: 28px; font-weight: 900; font-family: 'Cabinet Grotesk', sans-serif; color: #A5B4FC; }
        .h-ui-score-label { font-size: 11px; color: rgba(240,238,232,0.4); margin-top: 2px; }
        .h-ui-bar-chart { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .h-ui-bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: rgba(240,238,232,0.5); }
        .h-ui-bar-track { flex: 1; height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
        .h-ui-bar-fill { height: 100%; border-radius: 3px; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        /* ── STATS ── */
        .h-stats {
          position: relative; z-index: 1;
          padding: clamp(48px, 6vw, 72px) clamp(1.25rem, 4vw, 3rem);
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .h-stats-inner {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr));
          gap: 32px; text-align: center;
        }
        .h-stat-val {
          font-family: 'Cabinet Grotesk', sans-serif; font-size: clamp(2.4rem, 5vw, 3.5rem);
          font-weight: 900; letter-spacing: -0.04em; color: #F0EEE8; line-height: 1;
        }
        .h-stat-lbl { font-size: 13px; color: rgba(240,238,232,0.4); margin-top: 6px; font-weight: 500; }

        /* ── SECTIONS ── */
        .h-section {
          position: relative; z-index: 1;
          padding: clamp(72px, 8vw, 120px) clamp(1.25rem, 4vw, 3rem);
        }
        .h-section-inner { max-width: 1200px; margin: 0 auto; }
        .h-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.1em;
          color: #818CF8; margin-bottom: 18px; text-transform: uppercase;
        }
        .h-section-h2 {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: clamp(2rem, 4.5vw, 3.2rem);
          font-weight: 900; letter-spacing: -0.04em; line-height: 1.1;
          color: #F0EEE8; margin-bottom: 16px; max-width: 680px;
        }
        .h-section-sub {
          font-size: clamp(15px, 1.5vw, 17px); color: rgba(240,238,232,0.45);
          max-width: 520px; margin-bottom: clamp(40px, 5vw, 64px); line-height: 1.7;
        }

        /* ── FEATURE TABS ── */
        .h-feat-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
        @media (max-width: 860px) { .h-feat-wrap { grid-template-columns: 1fr; } }
        .h-feat-tabs { display: flex; flex-direction: column; gap: 4px; }
        .h-feat-tab {
          padding: 20px 22px; border-radius: 14px; cursor: pointer;
          border: 1px solid transparent; transition: all 0.25s;
          background: none;
        }
        .h-feat-tab.active {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
        }
        .h-feat-tab-tag {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 6px;
        }
        .h-feat-tab-title {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: 17px; font-weight: 800; letter-spacing: -0.02em;
          color: rgba(240,238,232,0.5); margin-bottom: 6px; transition: color 0.2s;
          line-height: 1.3;
        }
        .h-feat-tab.active .h-feat-tab-title { color: #F0EEE8; }
        .h-feat-tab-desc { font-size: 13.5px; color: rgba(240,238,232,0.4); line-height: 1.6; display: none; }
        .h-feat-tab.active .h-feat-tab-desc { display: block; }
        .h-feat-tab-cta {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 14px; font-size: 13px; font-weight: 700;
          border: none; background: none; cursor: pointer;
          font-family: 'Satoshi', sans-serif; padding: 0; transition: gap 0.2s;
        }
        .h-feat-tab-cta:hover { gap: 10px; }
        .h-feat-panel {
          position: sticky; top: 96px; border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          min-height: 320px; display: flex; flex-direction: column;
        }
        .h-feat-panel-head {
          padding: 20px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px;
        }
        .h-feat-panel-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .h-feat-panel-body { padding: 22px; flex: 1; }

        /* Mock job cards */
        .h-mock-job { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .h-mock-job:last-child { border: none; }
        .h-mock-logo { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
        .h-mock-score { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
        .h-mock-score-num { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 900; }
        .h-mock-bar { width: 48px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); overflow: hidden; }
        .h-mock-bar-fill { height: 100%; border-radius: 2px; }

        /* ── HOW IT WORKS ── */
        .h-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 2px; }
        .h-step {
          padding: 32px 28px; position: relative;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .h-step:first-child { border-radius: 16px 0 0 16px; }
        .h-step:last-child { border-radius: 0 16px 16px 0; }
        @media (max-width: 640px) { .h-step { border-radius: 12px !important; } }
        .h-step-n {
          font-family: 'Cabinet Grotesk', sans-serif; font-size: 3rem; font-weight: 900;
          letter-spacing: -0.06em; color: rgba(255,255,255,0.06); line-height: 1; margin-bottom: 20px;
        }
        .h-step-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .h-step-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 16px; font-weight: 800; letter-spacing: -0.02em; color: #F0EEE8; margin-bottom: 8px; }
        .h-step-desc { font-size: 13.5px; color: rgba(240,238,232,0.4); line-height: 1.6; }

        /* ── EXTENSION SECTION ── */
        .h-ext-section {
          margin: 0 clamp(1.25rem, 4vw, 3rem);
          border-radius: 24px; overflow: hidden;
          background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(16,185,129,0.08) 100%);
          border: 1px solid rgba(99,102,241,0.2);
          padding: clamp(48px, 6vw, 80px) clamp(1.5rem, 5vw, 72px);
          display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;
        }
        @media (max-width: 720px) { .h-ext-section { grid-template-columns: 1fr; } }
        .h-ext-title {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 900;
          letter-spacing: -0.04em; color: #F0EEE8; line-height: 1.1; margin-bottom: 14px;
        }
        .h-ext-sub { font-size: 15px; color: rgba(240,238,232,0.5); line-height: 1.7; max-width: 460px; margin-bottom: 28px; }
        .h-ext-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; }
        .h-ext-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(240,238,232,0.65); }
        .h-ext-check { width: 20px; height: 20px; border-radius: 50%; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .h-ext-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 700; color: white;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          border: none; cursor: pointer; font-family: 'Satoshi', sans-serif;
          box-shadow: 0 8px 32px rgba(99,102,241,0.35);
          transition: all 0.2s;
        }
        .h-ext-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99,102,241,0.5); }
        .h-ext-puzzle {
          width: 120px; height: 120px; border-radius: 28px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* ── TESTIMONIALS ── */
        .h-testi-scroll { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x mandatory; }
        .h-testi-scroll::-webkit-scrollbar { display: none; }
        .h-testi {
          flex-shrink: 0; width: 300px; padding: 24px; border-radius: 16px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          scroll-snap-align: start;
        }
        .h-testi-stars { display: flex; gap: 3px; margin-bottom: 14px; }
        .h-testi-text { font-size: 14px; color: rgba(240,238,232,0.7); line-height: 1.7; margin-bottom: 18px; font-style: italic; }
        .h-testi-author { display: flex; align-items: center; gap: 10px; }
        .h-testi-av {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: white;
        }
        .h-testi-name { font-size: 13px; font-weight: 700; color: #F0EEE8; }
        .h-testi-role { font-size: 12px; color: rgba(240,238,232,0.35); }

        /* ── FINAL CTA ── */
        .h-final {
          position: relative; z-index: 1;
          padding: clamp(80px, 10vw, 140px) clamp(1.25rem, 4vw, 3rem);
          text-align: center;
        }
        .h-final-h2 {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: clamp(2.4rem, 6vw, 4.5rem); font-weight: 900;
          letter-spacing: -0.05em; line-height: 1.0;
          color: #F0EEE8; margin-bottom: 20px;
        }
        .h-final-sub { font-size: clamp(15px, 1.5vw, 18px); color: rgba(240,238,232,0.4); margin-bottom: 40px; }
        .h-final-ctas { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }

        /* ── FOOTER ── */
        .h-footer {
          position: relative; z-index: 1;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 32px clamp(1.25rem, 4vw, 3rem);
        }
        .h-footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .h-footer-logo { display: flex; align-items: center; gap: 8px; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 14px; color: rgba(240,238,232,0.6); }
        .h-footer-copy { font-size: 12.5px; color: rgba(240,238,232,0.25); }
        .h-footer-links { display: flex; gap: 4px; }
        .h-footer-a { padding: 7px 12px; border-radius: 7px; font-size: 13px; color: rgba(240,238,232,0.35); background: none; border: none; cursor: pointer; font-family: 'Satoshi', sans-serif; transition: color 0.15s; }
        .h-footer-a:hover { color: rgba(240,238,232,0.7); }

        /* ── DARK ALT SECTION ── */
        .h-section-alt { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`h-nav ${scrolled ? "stuck" : ""}`}>
        <div className="h-nav-inner">
          <div className="h-logo" onClick={() => navigate("/")}>
            <div className="h-logo-mark"><FileSearch size={17} color="white" /></div>
            <span className="h-logo-name">ApplyBotPro</span>
          </div>
          <div className="h-nav-links">
            <button className="h-nav-a" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
            <button className="h-nav-a" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
            <button className="h-nav-a" onClick={() => navigate("/pricing")}>Pricing</button>
          </div>
          <div className="h-nav-ctas">
            <button className="h-nav-ghost" onClick={() => navigate(user ? "/analyze" : "/login")}>{user ? "Dashboard" : "Sign in"}</button>
            <button className="h-nav-solid" onClick={() => navigate(user ? "/jobs/recommend" : "/register")}>
              {user ? "My Jobs" : "Get started"} <ArrowRight size={13} />
            </button>
          </div>
          <button className="h-hamburger" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`h-mobile-menu ${menuOpen ? "open" : ""}`}>
        <button className="h-hamburger" style={{ alignSelf: "flex-end", marginBottom: 16 }} onClick={() => setMenuOpen(false)}><X size={22} /></button>
        {["Features", "How it works", "Pricing"].map(l => (
          <button key={l} className="h-mobile-a" onClick={() => { setMenuOpen(false); if (l === "Pricing") navigate("/pricing"); else document.getElementById(l === "Features" ? "features" : "how")?.scrollIntoView({ behavior: "smooth" }); }}>{l}</button>
        ))}
        <button className="h-mobile-a" onClick={() => { setMenuOpen(false); navigate(user ? "/analyze" : "/login"); }}>{user ? "Dashboard" : "Sign in"}</button>
        <button style={{ marginTop: 8 }} className="h-btn-primary" onClick={() => { setMenuOpen(false); navigate(user ? "/jobs/recommend" : "/register"); }}>
          Get started free <ArrowRight size={14} />
        </button>
      </div>

      {/* ── HERO ── */}
      <section className="h-hero">
        <div className="h-hero-glow h-hero-glow1" />
        <div className="h-hero-glow h-hero-glow2" />

        <div className="h-hero-badge">
          <div className="h-hero-badge-dot" />
          Your AI Career Copilot
        </div>

        <h1 className="h-hero-h1">
          Stop Solo Job Hunting.<br />
          <span className="h-hero-accent">Do It With AI.</span>
        </h1>

        <p className="h-hero-sub">
          Get matched jobs, tailored CVs, and AI-written applications — all personalised to your actual experience. Land interviews, not just rejections.
        </p>

        <div className="h-hero-ctas">
          <button className="h-btn-primary" onClick={() => go("/jobs/recommend")}>
            Find My Jobs <ArrowRight size={15} />
          </button>
          <button className="h-btn-secondary" onClick={() => go("/analyze")}>
            <FileSearch size={15} /> Analyze My CV
          </button>
        </div>

        <div className="h-ext-bar" onClick={() => window.open("https://chrome.google.com/webstore", "_blank")}>
          <Puzzle size={14} />
          <span>Get the browser extension</span>
          <div className="h-ext-bar-pill">FREE</div>
          <ChevronRight size={13} />
        </div>

        {/* Hero UI mockup */}
        <div className="h-hero-ui">
          <div className="h-ui-bar">
            <div className="h-ui-dot" style={{ background: "#FF5F56" }} />
            <div className="h-ui-dot" style={{ background: "#FFBD2E" }} />
            <div className="h-ui-dot" style={{ background: "#27C93F" }} />
            <div style={{ flex: 1, height: 20, borderRadius: 4, background: "rgba(255,255,255,0.05)", marginLeft: 12, maxWidth: 240 }} />
          </div>
          <div className="h-ui-body">
            {/* Job matches */}
            <div className="h-ui-card">
              <div className="h-ui-card-label">YOUR MATCHES TODAY</div>
              {[
                { co: "Stripe", title: "Senior Frontend Engineer", score: 94, color: "#6366F1", bg: "rgba(99,102,241,0.15)", initials: "ST" },
                { co: "Notion", title: "Product Designer", score: 88, color: "#10B981", bg: "rgba(16,185,129,0.15)", initials: "NO" },
                { co: "Linear", title: "Full Stack Engineer", score: 82, color: "#F59E0B", bg: "rgba(245,158,11,0.15)", initials: "LN" },
              ].map(j => (
                <div key={j.co} className="h-mock-job">
                  <div className="h-mock-logo" style={{ background: j.bg, color: j.color }}>{j.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(240,238,232,0.9)" }}>{j.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(240,238,232,0.4)", marginTop: 2 }}>{j.co}</div>
                  </div>
                  <div className="h-mock-score">
                    <div className="h-mock-score-num" style={{ color: j.color }}>{j.score}%</div>
                    <div className="h-mock-bar"><div className="h-mock-bar-fill" style={{ width: `${j.score}%`, background: j.color }} /></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Fit score */}
            <div className="h-ui-card">
              <div className="h-ui-card-label">FIT ANALYSIS</div>
              <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
                <div className="h-ui-score">92%</div>
                <div className="h-ui-score-label">Match Score</div>
              </div>
              <div className="h-ui-bar-chart">
                {[["Technical Skills", 96, "#6366F1"], ["Experience Level", 90, "#10B981"], ["Keywords Match", 88, "#F59E0B"], ["Culture Fit", 84, "#EC4899"]].map(([l, p, c]) => (
                  <div key={l as string} className="h-ui-bar-row">
                    <span style={{ width: 90 }}>{l as string}</span>
                    <div className="h-ui-bar-track"><div className="h-ui-bar-fill" style={{ width: `${p}%`, background: c as string }} /></div>
                    <span style={{ width: 30, textAlign: "right" }}>{p}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="h-stats" ref={statsRef}>
        <div className="h-stats-inner">
          <Stat value={50000} suffix="+" label="Jobs matched daily" started={statsStarted} />
          <Stat value={85} suffix="%" label="CV match accuracy" started={statsStarted} />
          <Stat value={3} suffix="x" label="More interviews landed" started={statsStarted} />
          <Stat value={80} suffix="%" label="Time saved on applications" started={statsStarted} />
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="h-section" id="features">
        <div className="h-section-inner">
          <div className="h-eyebrow"><Sparkles size={11} /> Features</div>
          <h2 className="h-section-h2">Everything you need to land the role</h2>
          <p className="h-section-sub">Four AI tools covering the full job hunt — from discovery to offer.</p>
          <div className="h-feat-wrap">
            <div className="h-feat-tabs">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <button key={f.tag} className={`h-feat-tab ${activeFeature === i ? "active" : ""}`} onClick={() => setActiveFeature(i)}>
                    <div className="h-feat-tab-tag" style={{ color: f.accent }}>{f.tag}</div>
                    <div className="h-feat-tab-title">{f.title}</div>
                    <div className="h-feat-tab-desc">{f.desc}</div>
                    {activeFeature === i && (
                      <button className="h-feat-tab-cta" style={{ color: f.accent }} onClick={(e) => { e.stopPropagation(); go(f.link); }}>
                        {f.cta} <ArrowRight size={13} />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="h-feat-panel">
              <div className="h-feat-panel-head">
                <div className="h-feat-panel-icon" style={{ background: FEATURES[activeFeature].bg }}>
                  {(() => { const Icon = FEATURES[activeFeature].icon; return <Icon size={18} color={FEATURES[activeFeature].accent} />; })()}
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: FEATURES[activeFeature].accent, textTransform: "uppercase" }}>{FEATURES[activeFeature].tag}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F0EEE8", marginTop: 2 }}>{FEATURES[activeFeature].title}</div>
                </div>
              </div>
              <div className="h-feat-panel-body">
                {activeFeature === 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,238,232,0.35)", letterSpacing: "0.06em", marginBottom: 12 }}>RECOMMENDED FOR YOU</div>
                    {[
                      { title: "Staff Software Engineer", co: "Vercel", fit: 96, tag: "Remote" },
                      { title: "Senior React Developer", co: "Shopify", fit: 91, tag: "Hybrid" },
                      { title: "Frontend Architect", co: "Figma", fit: 87, tag: "On-site" },
                    ].map(j => (
                      <div key={j.co} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#818CF8", flexShrink: 0 }}>{j.co[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(240,238,232,0.9)" }}>{j.title}</div>
                          <div style={{ fontSize: 11, color: "rgba(240,238,232,0.4)" }}>{j.co} · {j.tag}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#6366F1", fontFamily: "'Cabinet Grotesk', sans-serif" }}>{j.fit}%</div>
                      </div>
                    ))}
                  </>
                )}
                {activeFeature === 1 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,238,232,0.35)", letterSpacing: "0.06em", marginBottom: 12 }}>TAILORED IN SECONDS</div>
                    {[["ATS Keywords", "14 added", "#10B981"], ["Skills Section", "Reordered for role", "#10B981"], ["Summary", "Rewritten", "#10B981"], ["Missing Experience", "Flagged", "#F59E0B"]].map(([l, v, c]) => (
                      <div key={l as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                        <span style={{ color: "rgba(240,238,232,0.5)" }}>{l as string}</span>
                        <span style={{ color: c as string, fontWeight: 700 }}>{v as string}</span>
                      </div>
                    ))}
                  </>
                )}
                {activeFeature === 2 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,238,232,0.35)", letterSpacing: "0.06em", marginBottom: 14 }}>GENERATED FOR THIS ROLE</div>
                    <div style={{ fontSize: 13, color: "rgba(240,238,232,0.5)", lineHeight: 1.7, padding: "12px 14px", background: "rgba(245,158,11,0.06)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.12)" }}>
                      "Dear Hiring Manager, I'm writing to express my strong interest in the Senior Product Manager role at Linear. My 5 years building B2B SaaS products aligns directly with your focus on developer tools…"
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      {["Cover letter", "Email", "LinkedIn message"].map(t => (
                        <div key={t} style={{ padding: "5px 11px", borderRadius: 100, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", fontSize: 11, fontWeight: 700, color: "#FCD34D" }}>{t}</div>
                      ))}
                    </div>
                  </>
                )}
                {activeFeature === 3 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,238,232,0.35)", letterSpacing: "0.06em", marginBottom: 12 }}>YOUR FIT BREAKDOWN</div>
                    <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                      <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "'Cabinet Grotesk', sans-serif", color: "#EC4899", lineHeight: 1 }}>89%</div>
                      <div style={{ fontSize: 12, color: "rgba(240,238,232,0.4)", marginTop: 4 }}>Strong Match</div>
                    </div>
                    {[["Strengths", "8 identified", "#10B981"], ["Skill gaps", "2 minor", "#F59E0B"], ["Red flags", "None", "#6366F1"]].map(([l, v, c]) => (
                      <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                        <span style={{ color: "rgba(240,238,232,0.45)" }}>{l as string}</span>
                        <span style={{ color: c as string, fontWeight: 700 }}>{v as string}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="h-section h-section-alt" id="how">
        <div className="h-section-inner">
          <div className="h-eyebrow"><Zap size={11} /> How it works</div>
          <h2 className="h-section-h2">From CV to interview in 4 steps</h2>
          <p className="h-section-sub">No complexity. No setup time. Up and running in under 2 minutes.</p>
          <div className="h-steps">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="h-step">
                  <div className="h-step-n">{s.n}</div>
                  <div className="h-step-icon"><Icon size={18} color="#818CF8" /></div>
                  <div className="h-step-title">{s.title}</div>
                  <div className="h-step-desc">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EXTENSION ── */}
      <section className="h-section">
        <div className="h-section-inner">
          <div className="h-ext-section">
            <div>
              <div className="h-eyebrow"><Puzzle size={11} /> Browser Extension</div>
              <div className="h-ext-title">Apply anywhere,<br />in one click.</div>
              <p className="h-ext-sub">Our Chrome extension brings ApplyBotPro directly to job boards. See your fit score, autofill applications, and get AI briefings without leaving the page.</p>
              <div className="h-ext-features">
                {["Works on LinkedIn, Indeed, Glassdoor & more", "Instant fit score on any job listing", "Autofill applications with your saved profile", "One-click cover letter generation"].map(f => (
                  <div key={f} className="h-ext-feature">
                    <div className="h-ext-check"><CheckCircle size={11} color="#34D399" /></div>
                    {f}
                  </div>
                ))}
              </div>
              <button className="h-ext-btn" onClick={() => window.open("https://chrome.google.com/webstore", "_blank")}>
                <Puzzle size={16} /> Add to Chrome — It's Free
              </button>
            </div>
            <div className="h-ext-puzzle">
              <Puzzle size={56} color="rgba(99,102,241,0.6)" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="h-section h-section-alt" id="testimonials">
        <div className="h-section-inner">
          <div className="h-eyebrow"><Users size={11} /> Success stories</div>
          <h2 className="h-section-h2">Job seekers love it</h2>
          <p className="h-section-sub" style={{ marginBottom: "clamp(28px, 4vw, 40px)" }}>Real results from real people who got hired faster.</p>
          <div className="h-testi-scroll">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="h-testi">
                <div className="h-testi-stars">{[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}</div>
                <p className="h-testi-text">"{t.text}"</p>
                <div className="h-testi-author">
                  <div className="h-testi-av">{t.init}</div>
                  <div>
                    <div className="h-testi-name">{t.name}</div>
                    <div className="h-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="h-final">
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
          <div className="h-eyebrow" style={{ justifyContent: "center" }}><Sparkles size={11} /> Free to start · No credit card</div>
          <div className="h-final-h2">Your next job is<br /><span className="h-hero-accent">one upload away.</span></div>
          <p className="h-final-sub">Stop wondering why you're not getting callbacks. Get the AI that tells you exactly where you stand — and fixes it.</p>
          <div className="h-final-ctas">
            <button className="h-btn-primary" onClick={() => navigate(user ? "/jobs/recommend" : "/register")}>
              Get started free <ArrowRight size={15} />
            </button>
            <button className="h-btn-secondary" onClick={() => window.open("https://chrome.google.com/webstore", "_blank")}>
              <Puzzle size={15} /> Get the extension
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="h-footer">
        <div className="h-footer-inner">
          <div className="h-footer-logo">
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileSearch size={12} color="white" /></div>
            ApplyBotPro
          </div>
          <div className="h-footer-copy">© {new Date().getFullYear()} ApplyBotPro. All rights reserved.</div>
          <div className="h-footer-links">
            <button className="h-footer-a" onClick={() => navigate("/pricing")}>Pricing</button>
            <button className="h-footer-a" onClick={() => navigate("/login")}>Login</button>
            <button className="h-footer-a" onClick={() => navigate("/register")}>Sign up</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
