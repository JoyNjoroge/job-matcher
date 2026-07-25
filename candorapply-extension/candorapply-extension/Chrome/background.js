// Background Service Worker — CandorApply Extension
// Handles auth sync, profile caching, job tracking, application saving.

importScripts('config.js');

// ── Init ──────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[CandorApply] Extension installed v1.1');
  await syncAuthToken();
});

// ── Auth sync ─────────────────────────────────────────────────────────────────
// Tries localStorage first (how AuthContext.tsx stores tokens),
// then falls back to cookie.

async function syncAuthToken() {
  try {
    // 1. Ask any open CandorApply tab to read localStorage for us
    //    (service workers can't access localStorage directly)
    const tabs = await chrome.tabs.query({ url: CONFIG.FRONTEND_URL + '/*' });
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'READ_LOCAL_STORAGE' });
      return;
    }

    // 2. Fallback: cookie
    const hostname = new URL(CONFIG.APPLYBOTPRO_DOMAIN).hostname;
    const cookies  = await chrome.cookies.getAll({ domain: hostname });
    const auth     = cookies.find(c => c.name === CONFIG.AUTH.COOKIE_NAME);
    if (auth) {
      await chrome.storage.local.set({ authToken: auth.value });
      console.log('[Auth] Token from cookie');
    }
  } catch (e) {
    console.error('[Auth] syncAuthToken error:', e);
  }
}

// ── Message router ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Content script on the applybotpro domain reports the token
  if (request.type === 'AUTH_TOKEN_FOUND') {
    chrome.storage.local.set({ authToken: request.token });
    sendResponse({ success: true });
    return false;
  }

  if (request.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['authToken'], r => {
      sendResponse({ token: r.authToken || null });
    });
    return true;
  }

  if (request.type === 'SYNC_AUTH') {
    syncAuthToken().then(() => sendResponse({ success: true }));
    return true;
  }

  if (request.type === 'GET_USER_PROFILE') {
    getUserProfile().then(profile => sendResponse({ profile }));
    return true;
  }

  if (request.type === 'AUTOFILL_WITH_AI') {
    autofillWithBackend(request.fields, request.jobContext)
      .then(result => sendResponse(result));
    return true;
  }

  if (request.type === 'TRACK_JOB_CLICKED') {
    chrome.storage.local.set({
      [`tracked_job_${request.jobData.jobId}`]: {
        ...request.jobData,
        trackedAt: Date.now(),
      },
    });
    sendResponse({ success: true });
    return false;
  }

  if (request.type === 'MARK_APPLIED') {
    markJobAsApplied(request.applicationData)
      .then(ok => sendResponse({ success: ok }));
    return true;
  }
});

// ── Profile helpers ───────────────────────────────────────────────────────────

async function fetchUserProfile() {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) return null;

    const res = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.GET_PROFILE,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!res.ok) return null;

    const result = await res.json();

    // Normalise → flat profile shape content.js expects
    const u = result.user || {};
    const p = result.profile || u.profile || {};

    const profile = {
      name:          p.full_name        || u.full_name        || u.email?.split('@')[0] || 'User',
      email:         u.email            || '',
      phone:         p.phone            || '',
      address:       p.address          || '',
      city:          p.city             || p.location          || '',
      state:         p.state            || '',
      zip:           p.zip_code         || '',
      country:       p.country          || '',
      linkedin_url:  p.linkedin_url     || '',
      portfolio_url: p.portfolio_url    || '',
      github_url:    p.github_url       || '',
      resume_text:   p.resume_text      || p.cv_text           || '',
      skills:        p.skills           || [],
      experience:    p.experience       || p.work_experience   || [],
      education:     p.education        || [],
      summary:       p.summary          || p.bio               || '',
      job_title:     p.job_title        || p.headline          || '',
    };

    await chrome.storage.local.set({
      userProfile:      profile,
      profileCachedAt:  Date.now(),
    });

    return profile;
  } catch (e) {
    console.error('[Profile] fetchUserProfile error:', e);
    return null;
  }
}

async function getUserProfile() {
  const { userProfile, profileCachedAt } = await chrome.storage.local.get([
    'userProfile', 'profileCachedAt',
  ]);
  const FIVE_MIN = 5 * 60 * 1000;
  if (userProfile && profileCachedAt && Date.now() - profileCachedAt < FIVE_MIN) {
    return userProfile;
  }
  return fetchUserProfile();
}

// ── AI autofill via backend proxy ─────────────────────────────────────────────
// Sends field descriptors to our Flask backend which calls the LLM.
// The OpenRouter key stays on the server — never exposed in the extension.

async function autofillWithBackend(fields, jobContext = {}) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) return { error: 'not_authenticated' };

    const res = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.AUTOFILL_PROXY,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fields, job_context: jobContext }),
      }
    );

    if (!res.ok) return { error: 'server_error', status: res.status };
    return await res.json();   // { suggestions: [{ index, suggestedValue, confidence }] }
  } catch (e) {
    console.error('[AutoFill] Backend proxy error:', e);
    return { error: e.message };
  }
}

// ── Mark applied ──────────────────────────────────────────────────────────────

async function markJobAsApplied(applicationData) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) return false;

    const res = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.TRACK_APPLICATION,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${authToken}`,
        },
        body: JSON.stringify(applicationData),
      }
    );

    if (res.ok) {
      await chrome.storage.local.remove(`tracked_job_${applicationData.job_id}`);
      chrome.notifications.create({
        type:    'basic',
        iconUrl: 'icons/icon48.png',
        title:   'Application tracked!',
        message: `${applicationData.job_title} at ${applicationData.company} saved.`,
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Apply] markJobAsApplied error:', e);
    return false;
  }
}

// ── Tab monitoring ────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  try {
    const url   = new URL(tab.url);
    const jobId = url.searchParams.get(CONFIG.JOB_ID_PARAM);
    if (jobId) {
      chrome.tabs.sendMessage(tabId, { type: 'ACTIVATE_AUTOFILL', jobId });
    }
  } catch (_) {}
});

// Refresh token every 5 min
setInterval(syncAuthToken, 5 * 60 * 1000);
