import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPlans, cancelSubscription } from "@/api";
import type { Plan } from "@/types";

const PAYSTACK_LINKS: Record<string, string> = {
  seeker: "https://paystack.shop/pay/k0yr97mep-",
  pro:    "https://paystack.shop/pay/63s9eq94lp",  // add your pro link here when you create it on Paystack
};

const CHECK = (
  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LOCK = (
  <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7a4 4 0 00-8 0v4" />
  </svg>
);

export default function PricingPage() {
  const { plan, subscription, refreshUsage } = useAuth();
  const [plans, setPlans]       = useState<Plan[]>([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg]   = useState("");

  useEffect(() => {
    getPlans()
      .then(data => setPlans(data.plans))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = (planId: string) => {
    const link = PAYSTACK_LINKS[planId];
    if (link) window.open(link, "_blank");
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel? You'll keep access until the end of your billing period.")) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem("access_token") || "";
      await cancelSubscription(token);
      await refreshUsage();
      setCancelMsg("Subscription cancelled. You'll keep access until the end of your billing period.");
    } catch (e: any) {
      setCancelMsg(e.message || "Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Simple, affordable pricing</h1>
        <p className="text-muted-foreground">
          Built for job seekers. Cancel anytime.
        </p>
      </div>

      {/* Current plan banner */}
      {plan !== "free" && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-center">
          You're on the <span className="font-semibold capitalize">{plan}</span> plan.
          {subscription?.period_end && (
            <span className="text-muted-foreground ml-1">
              Renews {new Date(subscription.period_end).toLocaleDateString()}.
            </span>
          )}
        </div>
      )}

      {cancelMsg && (
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-center text-muted-foreground">
          {cancelMsg}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent  = plan === p.id;
          const isPopular  = p.id === "seeker";
          const canUpgrade = plan === "free" && p.id !== "free";
          const canUpgradeToPro = plan === "seeker" && p.id === "pro";

          return (
            <div
              key={p.id}
              className={`relative rounded-xl border p-6 space-y-5 flex flex-col ${
                isPopular
                  ? "border-primary shadow-md"
                  : "border-border"
              } ${isCurrent ? "bg-muted/40" : "bg-card"}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan name & price */}
              <div>
                <h2 className="text-lg font-semibold capitalize">{p.name}</h2>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-3xl font-bold">${p.price}</span>
                  {p.price > 0 && (
                    <span className="text-muted-foreground text-sm mb-1">/month</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {p.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {CHECK}
                    <span>{feature}</span>
                  </li>
                ))}
                {p.id === "free" && (
                  <>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      {LOCK} <span>Cover letters</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      {LOCK} <span>CV refinement</span>
                    </li>
                  </>
                )}
              </ul>

              {/* CTA */}
              <div className="pt-2">
                {isCurrent ? (
                  <div className="space-y-2">
                    <div className="w-full text-center text-sm font-medium py-2 rounded-lg bg-muted text-muted-foreground">
                      Current plan
                    </div>
                    {plan !== "free" && (
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="w-full text-xs text-center text-destructive hover:underline"
                      >
                        {cancelling ? "Cancelling..." : "Cancel subscription"}
                      </button>
                    )}
                  </div>
                ) : canUpgrade || canUpgradeToPro ? (
                  <button
                    onClick={() => handleUpgrade(p.id)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      isPopular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-primary text-primary hover:bg-primary/10"
                    }`}
                  >
                    Upgrade to {p.name}
                  </button>
                ) : p.id === "free" ? (
                  <div className="w-full text-center text-sm text-muted-foreground py-2">
                    Free forever
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-center">Common questions</h2>
        {[
          {
            q: "Can I cancel anytime?",
            a: "Yes. Cancel anytime and you'll keep access until the end of your billing period. No questions asked.",
          },
          {
            q: "Do limits reset daily?",
            a: "Yes. CV analysis and cover letter limits reset at midnight every day.",
          },
          {
            q: "What payment methods are accepted?",
            a: "All major cards via Paystack — Visa, Mastercard, and mobile money where supported.",
          },
          {
            q: "What happens if I hit the limit?",
            a: "You'll see a friendly message with your remaining count and an option to upgrade. Nothing breaks.",
          },
        ].map(({ q, a }) => (
          <div key={q} className="border rounded-lg p-4 space-y-1">
            <p className="font-medium text-sm">{q}</p>
            <p className="text-sm text-muted-foreground">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
