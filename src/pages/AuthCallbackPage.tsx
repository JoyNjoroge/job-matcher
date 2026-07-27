// src/pages/AuthCallbackPage.tsx
// Supabase redirects here after Google / LinkedIn OAuth.
// The access_token arrives either in the URL hash (#access_token=...)
// or as a query param (?access_token=...) depending on your Supabase config.
// This page reads it, stores it, then sends the user home.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loadFromTokens } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Supabase implicit flow puts tokens in the URL hash
    // e.g. /#access_token=xxx&refresh_token=yyy&token_type=bearer
    const hash = window.location.hash.substring(1);       // strip leading #
    const query = window.location.search.substring(1);    // strip leading ?
    const params = new URLSearchParams(hash || query);

    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const errorDesc    = params.get("error_description") || params.get("error");

    if (errorDesc) {
      setError(decodeURIComponent(errorDesc));
      return;
    }

    if (!accessToken || !refreshToken) {
      setError("No access token received. Please try signing in again.");
      return;
    }

    // Remove credentials from browser history before validating the session.
    window.history.replaceState(null, "", window.location.pathname);

    void loadFromTokens(accessToken, refreshToken)
      .then(() => navigate("/analyze", { replace: true }))
      .catch(() => setError("Could not finish signing in. Please try again."));
  }, [loadFromTokens, navigate]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "var(--font-ui)", gap: 16 }}>
        <p style={{ color: "#EF4444", fontSize: 15 }}>Sign-in failed: {error}</p>
        <button
          onClick={() => navigate("/login")}
          style={{ padding: "10px 24px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "var(--font-ui)" }}>
      <p style={{ color: "#6B7280", fontSize: 15 }}>Signing you in…</p>
    </div>
  );
}
