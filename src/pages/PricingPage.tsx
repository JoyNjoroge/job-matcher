/**
 * PricingPage.tsx — Fixed subscription logic + dark mode + mobile
 *
 * SUBSCRIPTION FIX: The original code only showed "upgrade" if plan === "free".
 * Now correctly shows current plan, allows downgrade path, and handles the
 * "seeker upgrading to pro" case. Also fixed the canUpgrade logic to properly
 * allow paid users to see the upgrade button for higher tiers.
 */
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPlans, cancelSubscription } from "@/api";
import type { Plan } from "@/types";
import { Check, Lock, Zap, Sparkles, Star, AlertCircle } from "lucide-react";

const PAYSTACK_LINKS: Record<string, string> = {
  seeker: "https://paystack.shop/pay/k0yr97mep-",
  pro: "https://paystack.shop/pay/63s9eq94lp",
};

const PLAN_ORDER = ["free", "seeker", "pro"];
const getPlanRank = (planId: string) => PLAN_ORDER.indexOf(planId);

export default function PricingPage() {
  const { plan, subscription, refreshUsage } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [cancelError, setCancelError] = useState(false);

  useEffect(() => {
    getPlans()
      .then((d) => setPlans(d.plans))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = (planId: string) => {
    const link = PAYSTACK_LINKS[planId];
    if (link) window.open(link, "_blank");
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You'll keep access until the end of your billing period.")) return;
    setCancelling(true);
    setCancelMsg("");
    setCancelError(false);
    try {
      const token = localStorage.getItem("access_token") || "";
      await cancelSubscription(token);
      await refreshUsage();
      setCancelMsg("Subscription cancelled. You'll keep access until your billing period ends.");
      setCancelError(false);
    } catch (e: any) {
      setCancelMsg(e.message || "Failed to cancel. Please contact support.");
      setCancelError(true);
    } finally {
      setCancelling(false);
    }
  };

  const currentRank = getPlanRank(plan || "free");

  const planAccents: Record<string, { color: string; bg: string; shadow: string }> = {
    free:   { color: "#6B7280", bg: "rgba(107,114,128,0.1)", shadow: "none" },
    seeker: { color: "#2563EB", bg: "rgba(37,99,235,0.1)",  shadow: "0 8px 32px rgba(37,99,235,0.2)" },
    pro:    { color: "#7C3AED", bg: "rgba(124,58,237,0.1)", shadow: "0 8px 32px rgba(124,58,237,0.18)" },
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border, rgba(0,0,0,0.1))", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="pricing-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pricing-root {
          font-family: 'DM Sans', var(--font-body, sans-serif);
          max-width: 960px; margin: 0 auto;
          padding: clamp(32px, 5vw, 56px) clamp(14px, 4vw, 28px) 80px;
          color: var(--text, #0A0A0F);
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        /* Header */
        .pr-header { text-align: center; margin-bottom: clamp(40px, 6vw, 64px); }
        .pr-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .pr-title { font-family: 'Syne', var(--font-display, sans-serif); font-size: clamp(1.9rem, 4.5vw, 2.8rem); font-weight: 800; letter-spacing: -0.03em; color: var(--text, #0A0A0F); margin: 0 0 12px; }
        .pr-sub { color: var(--text2, #6B7280); font-size: clamp(13.5px, 2vw, 15px); font-weight: 300; max-width: 440px; margin: 0 auto; line-height: 1.7; }

        /* Current plan banner */
        .pr-current-banner {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 20px; border-radius: 999px;
          font-size: 13px; font-weight: 600; width: fit-content;
          margin: 0 auto 28px;
          background: var(--accent-bg, rgba(37,99,235,0.08)); color: #2563EB;
          border: 1px solid rgba(37,99,235,0.15);
        }

        /* Messages */
        .pr-message {
          text-align: center; border-radius: 12px; padding: 13px 20px;
          font-size: 13px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pr-message-ok { background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.2); color: #059669; }
        .pr-message-err { background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2); color: #DC2626; }

        /* Plan grid */
        .pr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; margin-bottom: clamp(48px, 7vw, 72px); }

        /* Plan card */
        .pr-card {
          background: var(--surface, white); border: 1.5px solid var(--border, rgba(0,0,0,0.08));
          border-radius: 22px; padding: clamp(22px, 3vw, 32px);
          display: flex; flex-direction: column; position: relative;
          animation: fadeUp 0.4s ease both; transition: all 0.25s;
        }
        .pr-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.08); }
        .pr-card.popular { border-color: #2563EB; }
        .pr-card.current-plan { background: var(--surface2, #F9FAFB); }

        /* Popular badge */
        .pr-popular-badge {
          position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
          background: #2563EB; color: white; font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase; padding: 4px 14px;
          border-radius: 999px; white-space: nowrap;
        }

        /* Plan icon */
        .pr-plan-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .pr-current-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; background: rgba(16,185,129,0.1); color: #059669; margin-bottom: 8px; }
        .pr-plan-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.05rem; color: var(--text, #0A0A0F); margin: 0 0 8px; text-transform: capitalize; }
        .pr-price-row { display: flex; align-items: flex-end; gap: 3px; margin-bottom: 18px; }
        .pr-price { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2.4rem; color: var(--text, #0A0A0F); line-height: 1; }
        .pr-price-period { font-size: 13px; color: var(--text3, #9CA3AF); padding-bottom: 5px; }

        /* Features list */
        .pr-features { list-style: none; padding: 0; margin: 0 0 auto; display: flex; flex-direction: column; gap: 9px; padding-bottom: 24px; }
        .pr-feature { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: var(--text2, #374151); }
        .pr-feature-icon { flex-shrink: 0; margin-top: 1px; }
        .pr-feature-locked { color: var(--text3, #C4C4C4); }

        /* CTA area */
        .pr-cta { margin-top: auto; }
        .pr-btn {
          width: 100%; height: 44px; border-radius: 11px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 7px; border: none;
        }
        .pr-btn-primary { background: #2563EB; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.25); }
        .pr-btn-primary:hover { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.35); }
        .pr-btn-purple { background: #7C3AED; color: white; box-shadow: 0 4px 14px rgba(124,58,237,0.22); }
        .pr-btn-purple:hover { background: #6D28D9; transform: translateY(-1px); }
        .pr-btn-current { background: var(--surface2, rgba(0,0,0,0.05)); color: var(--text3, #9CA3AF); cursor: default; }
        .pr-btn-ghost { background: transparent; color: var(--text3, #9CA3AF); border: 1.5px solid var(--border, rgba(0,0,0,0.1)); cursor: default; }

        .pr-cancel-btn {
          display: block; text-align: center; font-size: 12px; color: #EF4444;
          margin-top: 9px; background: none; border: none; cursor: pointer;
          width: 100%; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;
          padding: 4px;
        }
        .pr-cancel-btn:hover { opacity: 0.75; }
        .pr-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* FAQ */
        .pr-faq { max-width: 680px; margin: 0 auto; }
        .pr-faq-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(1.4rem, 3vw, 1.8rem); letter-spacing: -0.02em; color: var(--text, #0A0A0F); text-align: center; margin-bottom: 24px; }
        .pr-faq-item { background: var(--surface, white); border: 1px solid var(--border, rgba(0,0,0,0.07)); border-radius: 13px; padding: 18px 22px; margin-bottom: 10px; transition: box-shadow 0.2s; }
        .pr-faq-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .pr-faq-q { font-weight: 600; font-size: 14px; color: var(--text, #0A0A0F); margin-bottom: 5px; }
        .pr-faq-a { font-size: 13.5px; color: var(--text2, #6B7280); line-height: 1.65; margin: 0; font-weight: 300; }

        /* Upgrade note */
        .pr-upgrade-note {
          display: flex; gap: 8px; align-items: flex-start;
          background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.15);
          border-radius: 10px; padding: 11px 14px; margin-bottom: 20px;
          font-size: 12.5px; color: #2563EB;
        }
      `}</style>

      {/* Header */}
      <div className="pr-header">
        <div className="pr-eyebrow"><Sparkles size={12} /> Pricing</div>
        <h1 className="pr-title">Simple, Honest Pricing</h1>
        <p className="pr-sub">Built for job seekers. No hidden fees. Cancel anytime.</p>
      </div>

      {/* Current plan indicator */}
      {(plan && plan !== "free") && (
        <div className="pr-current-banner">
          <Star size={13} fill="currentColor" />
          You're on the <strong>{plan}</strong> plan
          {subscription?.period_end && (
            <span style={{ fontWeight: 400, opacity: 0.75 }}>
              · Renews {new Date(subscription.period_end).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Message (cancel success/error) */}
      {cancelMsg && (
        <div className={`pr-message ${cancelError ? "pr-message-err" : "pr-message-ok"}`}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {cancelMsg}
        </div>
      )}

      {/* Upgrade note for free users */}
      {plan === "free" && (
        <div className="pr-upgrade-note">
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>You're on the free plan. Upgrade below to unlock more analyses, cover letters, and CV refinement.</span>
        </div>
      )}

      {/* Plan cards */}
      <div className="pr-grid">
        {plans.map((p, idx) => {
          const isCurrent = (plan || "free") === p.id;
          const isPopular = p.id === "seeker";
          const isPro = p.id === "pro";
          const accent = planAccents[p.id] || planAccents.free;

          // Upgrade/downgrade logic
          const planRank = getPlanRank(p.id);
          const canUpgrade = !isCurrent && planRank > currentRank;
          const isDowngrade = !isCurrent && planRank < currentRank;

          return (
            <div
              key={p.id}
              className={`pr-card${isPopular ? " popular" : ""}${isCurrent ? " current-plan" : ""}`}
              style={{ animationDelay: `${idx * 0.07}s`, boxShadow: isCurrent ? accent.shadow : undefined }}
            >
              {isPopular && <div className="pr-popular-badge">Most Popular</div>}

              <div className="pr-plan-icon" style={{ background: accent.bg }}>
                {p.id === "free"   && <Zap      size={20} color={accent.color} />}
                {p.id === "seeker" && <Star     size={20} color={accent.color} />}
                {p.id === "pro"    && <Sparkles size={20} color={accent.color} />}
              </div>

              {isCurrent && (
                <div className="pr-current-tag"><Check size={11} /> Current Plan</div>
              )}

              <div className="pr-plan-name">{p.name}</div>
              <div className="pr-price-row">
                <span className="pr-price">${p.price}</span>
                {p.price > 0 && <span className="pr-price-period">/month</span>}
              </div>

              <ul className="pr-features">
                {p.features.map((f, i) => (
                  <li key={i} className="pr-feature">
                    <Check size={14} color={accent.color} className="pr-feature-icon" />
                    {f}
                  </li>
                ))}
                {p.id === "free" && (
                  <>
                    <li className="pr-feature pr-feature-locked"><Lock size={13} className="pr-feature-icon" />Cover letters</li>
                    <li className="pr-feature pr-feature-locked"><Lock size={13} className="pr-feature-icon" />CV refinement</li>
                  </>
                )}
              </ul>

              <div className="pr-cta">
                {isCurrent ? (
                  <>
                    <button className="pr-btn pr-btn-current" disabled>Current Plan</button>
                    {plan !== "free" && (
                      <button className="pr-cancel-btn" onClick={handleCancel} disabled={cancelling}>
                        {cancelling ? "Cancelling…" : "Cancel subscription"}
                      </button>
                    )}
                  </>
                ) : canUpgrade ? (
                  <button
                    className={`pr-btn ${isPro ? "pr-btn-purple" : "pr-btn-primary"}`}
                    onClick={() => handleUpgrade(p.id)}
                  >
                    Upgrade to {p.name}
                  </button>
                ) : isDowngrade ? (
                  <button className="pr-btn pr-btn-ghost" disabled>Lower plan</button>
                ) : p.id === "free" ? (
                  <button className="pr-btn pr-btn-ghost" disabled>Free Forever</button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="pr-faq">
        <h2 className="pr-faq-title">Common Questions</h2>
        {[
          { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from this page and you'll keep access until the end of your billing period. No questions asked, no penalties." },
          { q: "Do limits reset daily?", a: "Yes. CV analysis and cover letter limits reset at midnight every day." },
          { q: "What payment methods are accepted?", a: "All major cards via Paystack — Visa, Mastercard, and mobile money where supported." },
          { q: "What if I hit the limit?", a: "You'll see a clear message showing your remaining count and an upgrade option. No surprise charges." },
          { q: "Can I upgrade from Seeker to Pro?", a: "Yes — click 'Upgrade to Pro' and you'll be taken to checkout. Your subscription will be updated after payment." },
        ].map(({ q, a }) => (
          <div key={q} className="pr-faq-item">
            <div className="pr-faq-q">{q}</div>
            <p className="pr-faq-a">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
