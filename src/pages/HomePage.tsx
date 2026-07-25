import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight, Check, ChevronDown, FileCheck2, Menu, MousePointer2,
  ScanSearch, ShieldCheck, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  {
    number: "01",
    title: "Build your source profile",
    copy: "Add the facts once—work history, links, location, and the answers you reuse. Your resume stays the source of truth.",
  },
  {
    number: "02",
    title: "Open any application",
    copy: "The extension reads the form structure on Greenhouse, Lever, Workday, and other career sites.",
  },
  {
    number: "03",
    title: "Review, then fill",
    copy: "You see what is ready, what is uncertain, and what needs you. Nothing is submitted for you.",
  },
];

const faqs = [
  ["Will it invent experience to match a job?", "No. If an answer is not supported by your profile, CandorApply leaves it blank and asks you to decide."],
  ["Does it automatically submit applications?", "No. It prepares fields for your review. The final review and submit action always stay with you."],
  ["Which application sites work?", "The extension is designed for standard forms and common ATS platforms, including Greenhouse, Lever, Workday, and SmartRecruiters."],
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const start = () => navigate(user ? "/profile" : "/register");

  return (
    <main className="landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Manrope:wght@500;600;700&display=swap');
        .landing { --ink:#17201d; --muted:#66706b; --line:#dfe4df; --paper:#f7f6f1; --green:#245c46; min-height:100vh; background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .landing * { box-sizing:border-box; }
        .l-wrap { width:min(1160px,calc(100% - 40px)); margin:0 auto; }
        .l-nav { height:76px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--line); }
        .l-brand { display:flex; align-items:center; gap:10px; border:0; background:none; color:var(--ink); cursor:pointer; font:700 17px 'Manrope',sans-serif; }
        .l-mark { width:30px; height:30px; border:1px solid var(--ink); border-radius:50%; display:grid; place-items:center; font-size:12px; }
        .l-links,.l-actions { display:flex; align-items:center; gap:26px; }
        .l-link { border:0; background:none; color:#46504b; font:500 14px inherit; cursor:pointer; }
        .l-btn { min-height:43px; padding:0 18px; border:1px solid var(--ink); border-radius:6px; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:transparent; color:var(--ink); font:600 14px inherit; cursor:pointer; transition:.18s ease; }
        .l-btn:hover { transform:translateY(-1px); }
        .l-btn.solid { background:var(--ink); color:white; }
        .l-menu { display:none; border:0; background:none; color:var(--ink); }
        .l-hero { min-height:680px; padding:92px 0 70px; display:grid; grid-template-columns:1.02fr .98fr; gap:76px; align-items:center; }
        .l-kicker { display:flex; align-items:center; gap:10px; color:var(--green); font-size:13px; font-weight:600; letter-spacing:.02em; margin-bottom:22px; }
        .l-kicker:before { content:''; width:30px; border-top:1px solid var(--green); }
        .l-title { margin:0; max-width:650px; font:600 clamp(44px,6vw,74px)/.99 'Manrope',sans-serif; letter-spacing:-.055em; }
        .l-title em { font-family:Georgia,serif; font-weight:400; }
        .l-lede { max-width:560px; margin:28px 0 34px; color:var(--muted); font-size:18px; line-height:1.65; }
        .l-hero-actions { display:flex; gap:12px; flex-wrap:wrap; }
        .l-note { margin-top:18px; color:#78817d; font-size:12px; }
        .review { background:#fff; border:1px solid #d7ddd8; border-radius:10px; box-shadow:0 24px 70px rgba(40,52,47,.12); overflow:hidden; transform:rotate(1deg); }
        .review-top { padding:18px 20px; border-bottom:1px solid #e6e9e6; display:flex; align-items:center; justify-content:space-between; }
        .review-title { font:600 14px 'Manrope',sans-serif; }
        .review-domain { font-size:11px; color:#89918d; }
        .review-body { padding:12px 20px 20px; }
        .review-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:#e5e9e6; border:1px solid #e5e9e6; border-radius:7px; overflow:hidden; margin:8px 0 18px; }
        .review-stat { background:#fafbf9; padding:12px; }
        .review-stat b { display:block; font:600 19px 'Manrope',sans-serif; }
        .review-stat span { font-size:10px; color:#7b847f; }
        .field { padding:13px 0; display:grid; grid-template-columns:22px 1fr auto; gap:10px; align-items:start; border-bottom:1px solid #edf0ed; }
        .field:last-of-type { border:0; }
        .field-icon { width:18px;height:18px;border-radius:50%;display:grid;place-items:center;margin-top:1px; }
        .field-icon.good { background:#e0eee6;color:#245c46; }
        .field-icon.ask { background:#f5e9d2;color:#8c5c0c;font-size:11px;font-weight:700; }
        .field-label { font-size:11px;color:#7b847f;margin-bottom:3px; }
        .field-value { font-size:13px;font-weight:500; }
        .field-state { font-size:10px;color:#688073;background:#eef5f0;padding:4px 7px;border-radius:20px; }
        .field-state.manual { color:#8c5c0c;background:#faf1df; }
        .review-action { margin-top:16px;width:100%;height:42px;border:0;border-radius:6px;background:var(--green);color:#fff;font:600 13px inherit; }
        .principles { background:var(--ink); color:#f4f2ea; padding:92px 0; }
        .principles-grid { display:grid;grid-template-columns:.8fr 1.2fr;gap:90px; }
        .section-tag { text-transform:uppercase;letter-spacing:.12em;font-size:11px;color:#93aaa0;margin-bottom:18px; }
        .section-title { font:600 clamp(31px,4vw,47px)/1.12 'Manrope',sans-serif;letter-spacing:-.04em;margin:0; }
        .principle-list { display:grid;gap:0; }
        .principle { display:grid;grid-template-columns:34px 1fr;gap:16px;padding:20px 0;border-top:1px solid rgba(255,255,255,.13); }
        .principle p { margin:5px 0 0;color:#aeb8b3;line-height:1.6;font-size:14px; }
        .steps { padding:100px 0; }
        .steps-head { max-width:650px;margin-bottom:55px; }
        .step-grid { display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line); }
        .step { padding:26px 42px 0 0; }
        .step-no { color:#829089;font-size:12px;margin-bottom:48px; }
        .step h3 { font:600 19px 'Manrope',sans-serif;margin:0 0 10px; }
        .step p { color:var(--muted);line-height:1.65;font-size:14px;margin:0; }
        .faq { padding:90px 0;background:#efeee7; }
        .faq-grid { display:grid;grid-template-columns:.7fr 1.3fr;gap:80px; }
        .faq-row { border-top:1px solid #ced4cf; }
        .faq-q { width:100%;padding:21px 0;border:0;background:none;display:flex;justify-content:space-between;text-align:left;color:var(--ink);font:600 15px inherit;cursor:pointer; }
        .faq-a { color:var(--muted);font-size:14px;line-height:1.7;padding:0 35px 22px 0; }
        .cta { padding:90px 0;text-align:center; }
        .cta .section-title { max-width:720px;margin:0 auto 26px; }
        .footer { border-top:1px solid var(--line);padding:30px 0;color:#78817d;font-size:12px;display:flex;justify-content:space-between; }
        @media(max-width:800px){.l-links,.l-actions .l-link{display:none}.l-menu{display:block}.l-actions{gap:10px}.l-hero{grid-template-columns:1fr;padding-top:65px;gap:45px}.review{transform:none}.principles-grid,.faq-grid{grid-template-columns:1fr;gap:45px}.step-grid{grid-template-columns:1fr}.step{padding:25px 0;border-bottom:1px solid var(--line)}.step-no{margin-bottom:18px}.l-mobile{position:absolute;top:76px;left:20px;right:20px;background:#fff;border:1px solid var(--line);padding:12px;z-index:4}.l-mobile .l-link{display:block;width:100%;padding:12px;text-align:left}}
      `}</style>

      <nav className="l-wrap l-nav">
        <button className="l-brand" onClick={() => navigate("/")}><span className="l-mark">A</span> CandorApply</button>
        <div className="l-links">
          <button className="l-link" onClick={() => document.getElementById("how")?.scrollIntoView()}>How it works</button>
          <button className="l-link" onClick={() => navigate("/pricing")}>Pricing</button>
          <button className="l-link" onClick={() => document.getElementById("safety")?.scrollIntoView()}>Safety</button>
        </div>
        <div className="l-actions">
          <button className="l-link" onClick={() => navigate(user ? "/profile" : "/login")}>{user ? "Dashboard" : "Sign in"}</button>
          <button className="l-btn solid" onClick={start}>{user ? "Open profile" : "Get started"}</button>
          <button className="l-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="l-mobile">
          <button className="l-link" onClick={() => document.getElementById("how")?.scrollIntoView()}>How it works</button>
          <button className="l-link" onClick={() => navigate("/pricing")}>Pricing</button>
          <button className="l-link" onClick={() => navigate("/login")}>Sign in</button>
        </div>}
      </nav>

      <section className="l-wrap l-hero">
        <div>
          <div className="l-kicker">A careful application assistant</div>
          <h1 className="l-title">Less form filling.<br /><em>More honest applying.</em></h1>
          <p className="l-lede">CandorApply fills job applications from your real experience, flags uncertain answers, and gives you the final say—so every application still sounds like you.</p>
          <div className="l-hero-actions">
            <button className="l-btn solid" onClick={start}>Create your profile <ArrowRight size={15} /></button>
            <button className="l-btn" onClick={() => document.getElementById("how")?.scrollIntoView()}>See how it works</button>
          </div>
          <div className="l-note">No automatic submissions · No invented experience · You review every answer</div>
        </div>
        <div className="review" aria-label="Example application review">
          <div className="review-top"><div><div className="review-title">Application review</div><div className="review-domain">Senior Product Designer · Greenhouse</div></div><ShieldCheck size={18} color="#245c46" /></div>
          <div className="review-body">
            <div className="review-summary">
              <div className="review-stat"><b>18</b><span>ready to fill</span></div>
              <div className="review-stat"><b>2</b><span>need review</span></div>
              <div className="review-stat"><b>0</b><span>unsupported</span></div>
            </div>
            <div className="field"><span className="field-icon good"><Check size={11}/></span><div><div className="field-label">Portfolio</div><div className="field-value">maya.design/work</div></div><span className="field-state">Profile</span></div>
            <div className="field"><span className="field-icon good"><Check size={11}/></span><div><div className="field-label">Years of product design experience</div><div className="field-value">6 years</div></div><span className="field-state">Resume</span></div>
            <div className="field"><span className="field-icon ask">?</span><div><div className="field-label">Will you require visa sponsorship?</div><div className="field-value">Answer required</div></div><span className="field-state manual">Your call</span></div>
            <button className="review-action">Fill 18 reviewed fields</button>
          </div>
        </div>
      </section>

      <section className="principles" id="safety">
        <div className="l-wrap principles-grid">
          <div><div className="section-tag">Built for trust</div><h2 className="section-title">Fast should not mean careless.</h2></div>
          <div className="principle-list">
            <div className="principle"><FileCheck2/><div><strong>Your record is the source</strong><p>Answers come from the profile and resume you control—not from plausible-sounding guesses.</p></div></div>
            <div className="principle"><ScanSearch/><div><strong>Uncertainty stays visible</strong><p>Low-confidence and sensitive questions are separated for review instead of being quietly filled.</p></div></div>
            <div className="principle"><MousePointer2/><div><strong>You remain the applicant</strong><p>CandorApply fills only after confirmation and never presses the final submit button.</p></div></div>
          </div>
        </div>
      </section>

      <section className="l-wrap steps" id="how">
        <div className="steps-head"><div className="section-tag" style={{color:"#527261"}}>How it works</div><h2 className="section-title">One profile. A calmer way through every form.</h2></div>
        <div className="step-grid">{steps.map(step => <article className="step" key={step.number}><div className="step-no">{step.number}</div><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
      </section>

      <section className="faq">
        <div className="l-wrap faq-grid">
          <div><div className="section-tag" style={{color:"#527261"}}>Questions</div><h2 className="section-title">Before you hand over a form.</h2></div>
          <div>{faqs.map(([q,a],i) => <div className="faq-row" key={q}><button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>{q}<ChevronDown size={17} style={{transform:openFaq===i?"rotate(180deg)":undefined}}/></button>{openFaq===i && <div className="faq-a">{a}</div>}</div>)}</div>
        </div>
      </section>

      <section className="l-wrap cta"><div className="section-tag" style={{color:"#527261"}}>Start with your facts</div><h2 className="section-title">Make the next application easier without making it generic.</h2><button className="l-btn solid" onClick={start}>Build my profile <ArrowRight size={15}/></button></section>
      <footer className="l-wrap footer"><span>© 2026 CandorApply</span><span>Review first. Apply with confidence.</span></footer>
    </main>
  );
}
