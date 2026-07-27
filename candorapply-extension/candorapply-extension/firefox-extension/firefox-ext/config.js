// ========================================
// CANDORAPPLY EXTENSION CONFIGURATION
// ========================================

const CONFIG = {
  // ── Website & API ──────────────────────────────────────────────────────────
  APPLYBOTPRO_DOMAIN: 'https://candorapply-backend.joynjoroge.site',
  FRONTEND_URL: 'https://candorapply.joynjoroge.site',

  API_ENDPOINTS: {
    // Auth + profile — matches /api/auth/me in auth.py
    GET_PROFILE:        '/api/auth/me',
    REFRESH_TOKEN:      '/api/auth/refresh',

    // Applications — matches applications_bp
    TRACK_APPLICATION:  '/api/applications',

    // AI autofill proxy — backend calls AI provider so the key stays server-side
    // We'll add this route to the Flask backend (routes/extension.py)
    AUTOFILL_PROXY:     '/api/extension/autofill',
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  AUTH: {
    // Must match what AuthContext.tsx uses
    LOCALSTORAGE_KEY: 'access_token',
    REFRESH_KEY:      'refresh_token',
    COOKIE_NAME:      'applybotpro_token',   // fallback
  },

  // ── Job tracking ───────────────────────────────────────────────────────────
  JOB_ID_PARAM: 'applybotpro_job_id',

  // ── Feature flags ──────────────────────────────────────────────────────────
  FEATURES: {
    // false = show Fill button on ANY job form (recommended for now)
    TRACKED_JOBS_ONLY: false,
    AUTO_DETECT_FORMS: false,
    DEBUG_MODE: false,  // flip to true during local dev
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
