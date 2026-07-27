/**
 * DidYouApplyModal
 *
 * Shows after the user clicks "Apply" / "Apply Anyway" / "Proceed to Application"
 * on either BriefingPage or ResultsPage. Asks whether they actually submitted
 * the application so we can append it to the Applications tab.
 *
 * Usage:
 *   <DidYouApplyModal
 *     isOpen={showDidYouApply}
 *     jobTitle="Python Developer"
 *     company="Acme Corp"
 *     onYes={() => { addApplication(...); setShowDidYouApply(false); }}
 *     onNo={() => setShowDidYouApply(false)}
 *   />
 */

import React, { useEffect } from "react";
import { CheckCircle, X, ExternalLink } from "lucide-react";

interface DidYouApplyModalProps {
  isOpen: boolean;
  jobTitle: string;
  company: string;
  onYes: () => void;
  onNo: () => void;
}

export const DidYouApplyModal: React.FC<DidYouApplyModalProps> = ({
  isOpen,
  jobTitle,
  company,
  onYes,
  onNo,
}) => {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onNo(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onNo]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      {/* Backdrop */}
      <div
        onClick={onNo}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(10,10,15,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "white",
        borderRadius: 20,
        padding: "36px 32px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        animation: "dyaFadeUp 0.25s ease",
        fontFamily: "var(--font-ui)",
      }}>
        <style>{`
          @keyframes dyaFadeUp {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onNo}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: 8,
            border: "none", background: "rgba(0,0,0,0.05)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9CA3AF", transition: "all 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.09)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(37,99,235,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <ExternalLink size={26} color="#2563EB" />
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 800, fontSize: "1.3rem",
          letterSpacing: "-0.02em", color: "#0A0A0F",
          margin: "0 0 8px",
        }}>
          Did you submit the application?
        </h2>

        <p style={{ fontSize: 14, color: "#6B7280", fontWeight: 300, lineHeight: 1.6, margin: "0 0 28px" }}>
          We opened <strong style={{ color: "#374151", fontWeight: 600 }}>{jobTitle}</strong>
          {company ? <> at <strong style={{ color: "#374151", fontWeight: 600 }}>{company}</strong></> : ""}{" "}
          for you. Did you complete and submit the application?
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onYes}
            style={{
              flex: 1, height: 48,
              background: "#2563EB", color: "white",
              border: "none", borderRadius: 12,
              fontFamily: "inherit", fontSize: 15, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#1D4ED8";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#2563EB";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <CheckCircle size={17} />
            Yes, I applied!
          </button>

          <button
            onClick={onNo}
            style={{
              flex: 1, height: 48,
              background: "white", color: "#374151",
              border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 12,
              fontFamily: "inherit", fontSize: 15, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#F9FAFB";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
            }}
          >
            Not yet
          </button>
        </div>

        <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 16 }}>
          Saying yes adds this to your Applications tracker
        </p>
      </div>
    </div>
  );
};

export default DidYouApplyModal;
