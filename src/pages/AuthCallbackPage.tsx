// src/pages/AuthCallbackPage.tsx
// Supabase redirects here after Google / LinkedIn OAuth.
// The access_token arrives either in the URL hash (#access_token=...)
// or as a query param (?access_token=...) depending on your Supabase config.
// This page reads it, stores it, then sends the user home.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

      // Clean the tokens out of the URL before navigating
      window.history.replaceState(null, "", window.location.pathname);

      navigate("/analyze", { replace: true });
    } else {
      setError("No access token received. Please try signing in again.");
    }
  }, [navigate]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "DM Sans, sans-serif", gap: 16 }}>
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <p style={{ color: "#6B7280", fontSize: 15 }}>Signing you in…</p>
    </div>
  );
}
