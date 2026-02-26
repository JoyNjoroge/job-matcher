import React from "react";
import { useNavigate } from "react-router-dom";
import type { FeatureBlockedError } from "@/types";

interface UpgradePromptProps {
  error: FeatureBlockedError;
  onDismiss?: () => void;
}

export function UpgradePrompt({ error, onDismiss }: UpgradePromptProps) {
  const navigate = useNavigate();

  const isLocked      = error.error_code === "feature_locked";
  const isLimitReached = error.error_code === "daily_limit_reached";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{isLocked ? "🔒" : "⚡"}</div>
        <div className="flex-1 space-y-1">
          <p className="font-medium text-sm text-amber-900">
            {isLocked ? "Feature not available on your plan" : "Daily limit reached"}
          </p>
          <p className="text-sm text-amber-800">{error.error}</p>

          {isLimitReached && error.limit && (
            <div className="mt-2 h-1.5 w-full bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-full" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => navigate("/pricing")}
          className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
        >
          View plans →
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-2 rounded-lg border border-amber-300 text-amber-800 text-sm hover:bg-amber-100 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

// Inline version for inside forms/cards
export function UpgradeInline({ message, planRequired }: { message: string; planRequired?: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span>🔒</span>
        <span className="text-muted-foreground">{message}</span>
      </div>
      <button
        onClick={() => navigate("/pricing")}
        className="text-primary text-xs font-medium hover:underline whitespace-nowrap ml-3"
      >
        Upgrade {planRequired ? `to ${planRequired}` : ""}→
      </button>
    </div>
  );
}
