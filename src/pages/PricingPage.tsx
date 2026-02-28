import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPlans, cancelSubscription } from "@/api";
import type { Plan } from "@/types";
import { Check, Lock, Zap, Sparkles, Star } from "lucide-react";

const PAYSTACK_LINKS: Record<string, string> = {
  seeker: "https://paystack.shop/pay/k0yr97mep-",
  pro: "https://paystack.shop/pay/63s9eq94lp",
};

export default function PricingPage() {
  const { plan, subscription, refreshUsage } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    getPlans().then((d) => setPlans(d.plans)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = (planId: string) => {
    const link = PAYSTACK_LINKS[planId];
    if (link) window.open(link, "_blank");
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You'll keep access until the end of your billing period.")) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem("access_token") || "";
      await cancelSubscription(token);
      await refreshUsage();
      setCancelMsg("Subscription cancelled. Access continues until billing period ends.");
    } catch (e: any) {
      setCancelMsg(e.message || "Failed to cancel. Please try again.");
    } finally { setCancelling(false); }
  };

  const planAccents: Record<string, { color: string; bg: string }> = {
    free: { color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
    seeker: { color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
    pro: { color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(37,99,235,0.2)", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="pricing-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .pricing-root { font-family: 'DM Sans', sans-serif; max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .pr2-header { text-align: center; margin-bottom: 60px; }
        .pr2-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .pr2-title { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; letter-spacing: -0.03em; color: #0A0A0F; margin: 0 0 12px; }
        .pr2-sub { color: #6B7280; font-size: 15px; font-weight: 300; max-width: 440px; margin: 0 auto; line-height: 1.7; }

        /* Current plan banner */
        .pr2-banner { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.15); border-radius: 999px; font-size: 13px; color: #2563EB; font-weight: 600; width: fit-content; margin: 0 auto 28px; }

        /* Cancel message */
        .pr2-cancel-msg { background: rgba(0,0,0,0.04); border-radius: 12px; padding: 12px 20px; text-align: center; font-size: 13px; color: #6B7280; margin-bottom: 28px; }

        /* Grid */
        .pr2-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 64px; }

        /* Plan card */
        .pr2-card { background: white; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 24px; padding: 32px; display: flex; flex-direction: column; transition: all 0.25s; position: relative; animation: fadeUp 0.5s ease both; }
        .pr2-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
        .pr2-card.popular { border-color: #2563EB; box-shadow: 0 8px 40px rgba(37,99,235,0.12); }
        .pr2-card.current { background: #F9FAFB; }

        /* Popular badge */
        .pr2-popular-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: #2563EB; color: white; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 5px 16px; border-radius: 999px; white-space: nowrap; }

        /* Plan name + price */
        .pr2-plan-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .pr2-plan-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; color: #0A0A0F; margin: 0 0 8px; text-transform: capitalize; }
        .pr2-price-row { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 20px; }
        .pr2-price { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2.5rem; color: #0A0A0F; line-height: 1; }
        .pr2-price-period { font-size: 13px; color: #9CA3AF; padding-bottom: 6px; }

        /* Features */
        .pr2-features { list-style: none; padding: 0; margin: 0 0 auto; display: flex; flex-direction: column; gap: 10px; padding-bottom: 28px; }
        .pr2-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #374151; }
        .pr2-feature-icon { flex-shrink: 0; margin-top: 1px; }
        .pr2-feature-locked { color: #C4C4C4; }

        /* CTA */
        .pr2-cta { margin-top: auto; }
        .pr2-btn { width: 100%; height: 46px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; }
        .pr2-btn-primary { background: #2563EB; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.28); }
        .pr2-btn-primary:hover { background: #1D4ED8; transform: translateY(-1px); }
        .pr2-btn-purple { background: #7C3AED; color: white; box-shadow: 0 4px 14px rgba(124,58,237,0.25); }
        .pr2-btn-purple:hover { background: #6D28D9; transform: translateY(-1px); }
        .pr2-btn-current { background: rgba(0,0,0,0.05); color: #9CA3AF; cursor: default; }
        .pr2-btn-free { background: transparent; color: #9CA3AF; border: 1.5px solid rgba(0,0,0,0.1); cursor: default; }
        .pr2-cancel-link { display: block; text-align: center; font-size: 12px; color: #EF4444; margin-top: 10px; background: none; border: none; cursor: pointer; width: 100%; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
        .pr2-cancel-link:hover { opacity: 0.8; }
        .pr2-current-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; background: rgba(16,185,129,0.1); color: #059669; margin-bottom: 8px; }

        /* FAQ */
        .pr2-faq { max-width: 680px; margin: 0 auto; }
        .pr2-faq-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.02em; color: #0A0A0F; text-align: center; margin-bottom: 28px; }
        .pr2-faq-item { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 20px 24px; margin-bottom: 12px; transition: box-shadow 0.2s; }
        .pr2-faq-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .pr2-faq-q { font-weight: 600; font-size: 14px; color: #0A0A0F; margin-bottom: 6px; }
        .pr2-faq-a { font-size: 14px; color: #6B7280; line-height: 1.65; margin: 0; font-weight: 300; }
      `}</style>

      <div className="pr2-header">
        <div className="pr2-eyebrow"><Sparkles size={12} /> Pricing</div>
        <h1 className="pr2-title">Simple, Honest Pricing</h1>
        <p className="pr2-sub">Built for job seekers. No hidden fees. Cancel anytime with a click.</p>
      </div>

      {plan !== "free" && (
        <div className="pr2-banner">
          <Star size={13} fill="currentColor" />
          You're on the {plan} plan
          {subscription?.period_end && (
            <span style={{ fontWeight: 400, color: "#93C5FD" }}>
              · Renews {new Date(subscription.period_end).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {cancelMsg && <div className="pr2-cancel-msg">{cancelMsg}</div>}

      <div className="pr2-grid">
        {plans.map((p, idx) => {
          const isCurrent = plan === p.id;
          const isPopular = p.id === "seeker";
          const isPro = p.id === "pro";
          const canUpgrade = plan === "free" && p.id !== "free";
          const canUpgradeToPro = plan === "seeker" && isPro;
          const accent = planAccents[p.id] || planAccents.free;

          return (
            <div key={p.id} className={`pr2-card${isPopular ? " popular" : ""}${isCurrent ? " current" : ""}`} style={{ animationDelay: `${idx * 0.08}s` }}>
              {isPopular && <div className="pr2-popular-badge">Most Popular</div>}

              <div className="pr2-plan-icon" style={{ background: accent.bg }}>
                {p.id === "free" ? <Zap size={20} color={accent.color} /> : p.id === "seeker" ? <Star size={20} color={accent.color} /> : <Sparkles size={20} color={accent.color} />}
              </div>

              {isCurrent && <div className="pr2-current-tag"><Check size={11} /> Current Plan</div>}

              <div className="pr2-plan-name">{p.name}</div>
              <div className="pr2-price-row">
                <span className="pr2-price">${p.price}</span>
                {p.price > 0 && <span className="pr2-price-period">/month</span>}
              </div>

              <ul className="pr2-features">
                {p.features.map((f, i) => (
                  <li key={i} className="pr2-feature">
                    <Check size={15} color={accent.color} className="pr2-feature-icon" />
                    {f}
                  </li>
                ))}
                {p.id === "free" && (
                  <>
                    <li className="pr2-feature pr2-feature-locked"><Lock size={14} className="pr2-feature-icon" />Cover letters</li>
                    <li className="pr2-feature pr2-feature-locked"><Lock size={14} className="pr2-feature-icon" />CV refinement</li>
                  </>
                )}
              </ul>

              <div className="pr2-cta">
                {isCurrent ? (
                  <>
                    <button className="pr2-btn pr2-btn-current" disabled>Current Plan</button>
                    {plan !== "free" && (
                      <button className="pr2-cancel-link" onClick={handleCancel} disabled={cancelling}>
                        {cancelling ? "Cancelling…" : "Cancel subscription"}
                      </button>
                    )}
                  </>
                ) : canUpgrade || canUpgradeToPro ? (
                  <button
                    className={`pr2-btn ${isPro ? "pr2-btn-purple" : "pr2-btn-primary"}`}
                    onClick={() => handleUpgrade(p.id)}
                  >
                    Upgrade to {p.name}
                  </button>
                ) : p.id === "free" ? (
                  <button className="pr2-btn pr2-btn-free" disabled>Free Forever</button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="pr2-faq">
        <h2 className="pr2-faq-title">Common Questions</h2>
        {[
          { q: "Can I cancel anytime?", a: "Yes. Cancel anytime and you'll keep access until the end of your billing period. No questions asked, no penalties." },
          { q: "Do limits reset daily?", a: "Yes. CV analysis and cover letter limits reset at midnight every day." },
          { q: "What payment methods are accepted?", a: "All major cards via Paystack — Visa, Mastercard, and mobile money where supported." },
          { q: "What happens if I hit the limit?", a: "You'll see a clear message with your remaining count and a quick upgrade option. Nothing breaks, no surprise charges." },
        ].map(({ q, a }) => (
          <div key={q} className="pr2-faq-item">
            <div className="pr2-faq-q">{q}</div>
            <p className="pr2-faq-a">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
