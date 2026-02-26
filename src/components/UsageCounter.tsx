import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { FeatureUsage } from "@/types";

interface UsageBarProps {
  label: string;
  featureUsage: FeatureUsage;
}

function UsageBar({ label, featureUsage }: UsageBarProps) {
  const { used, limit, locked, unlimited } = featureUsage;

  if (locked) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Locked
        </span>
      </div>
    );
  }

  if (unlimited) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-xs text-green-600 font-medium">Unlimited</span>
      </div>
    );
  }

  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit   = used >= limit;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={`text-xs font-medium ${
            isAtLimit
              ? "text-red-500"
              : isNearLimit
              ? "text-amber-500"
              : "text-foreground"
          }`}
        >
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit
              ? "bg-red-500"
              : isNearLimit
              ? "bg-amber-500"
              : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface UsageCounterProps {
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export function UsageCounter({ onUpgradeClick, compact = false }: UsageCounterProps) {
  const { usage, plan } = useAuth();

  if (!usage) return null;

  const { features } = usage;

  if (compact) {
    // Small pill version for navbar/sidebar
    const cvUsage = features.cv_analysis;
    if (cvUsage.unlimited) return null;

    const percentage = Math.min((cvUsage.used / cvUsage.limit) * 100, 100);
    const isNearLimit = percentage >= 80;

    return (
      <button
        onClick={onUpgradeClick}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
          isNearLimit
            ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
            : "border-border text-muted-foreground hover:bg-muted"
        }`}
      >
        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isNearLimit ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span>{cvUsage.used}/{cvUsage.limit} analyses</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Today's Usage</h3>
        <span className="text-xs capitalize text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {plan} plan
        </span>
      </div>

      <div className="space-y-3">
        <UsageBar label="CV Analyses" featureUsage={features.cv_analysis} />
        <UsageBar label="Cover Letters" featureUsage={features.cover_letter} />
      </div>

      {plan === "free" && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="w-full text-xs text-center text-primary hover:underline mt-1"
        >
          Upgrade for more →
        </button>
      )}
    </div>
  );
}
