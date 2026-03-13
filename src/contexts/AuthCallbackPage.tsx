// src/pages/AuthCallbackPage.tsx
// Handles redirect from backend OAuth flow.
// Backend sends tokens as query params: /auth/callback?access_token=...&refresh_token=...

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Backend sends tokens as query params (not hash)
    const params = new URLSearchParams(window.location.search);

    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const oauthError   = params.get("oauth_error");

    // Clean tokens out of the URL immediately
    window.history.replaceState(null, "", window.location.pathname);

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      return;
    }

    if (!accessToken) {
      setError("No access token received. Please try signing in again.");
      return;
    }

    // Store tokens
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

    // Send to dashboard
    navigate("/analyze", { replace: true });
  }, [navigate]);

  if (error) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh",
        fontFamily: "DM Sans, sans-serif", gap: 16,
      }}>
        <p style={{ color: "#EF4444", fontSize: 15 }}>
          Sign-in failed: {error}
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "10px 24px", background: "#2563EB", color: "white",
            border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14,
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", fontFamily: "DM Sans, sans-serif",
    }}>
      <p style={{ color: "#6B7280", fontSize: 15 }}>Signing you in…</p>
    </div>
  );
}
