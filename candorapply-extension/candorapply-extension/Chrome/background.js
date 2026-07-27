// Background Service Worker — CandorApply Extension
// Handles auth sync, profile caching, job tracking, application saving.

importScripts('config.js');

// ── Init ──────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[CandorApply] Extension installed v1.4');
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
      // A matching tab can exist before its content script has loaded (or after
      // the extension was reloaded). That is a normal race, not an auth error.
      let credentials = null;
      try {
        credentials = await chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'READ_LOCAL_STORAGE' }
        );
      } catch (error) {
        if (!String(error?.message || error).includes('Receiving end does not exist')) {
          throw error;
        }
      }
      if (credentials?.token) {
        await chrome.storage.local.set({
          authToken: credentials.token,
          refreshToken: credentials.refreshToken || null,
        });
        return true;
      }
    }

    // 2. Fallback: cookie
    const hostname = new URL(CONFIG.APPLYBOTPRO_DOMAIN).hostname;
    const cookies  = await chrome.cookies.getAll({ domain: hostname });
    const auth     = cookies.find(c => c.name === CONFIG.AUTH.COOKIE_NAME);
    if (auth) {
      await chrome.storage.local.set({ authToken: auth.value });
      console.log('[Auth] Token from cookie');
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Auth] syncAuthToken error:', e);
    return false;
  }
}

// ── Message router ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Content script on the CandorApply domain reports the tokens.
  if (request.type === 'AUTH_TOKEN_FOUND') {
    chrome.storage.local.set({
      authToken: request.token,
      refreshToken: request.refreshToken || null,
    });
    sendResponse({ success: true });
    return false;
  }

  if (request.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['authToken', 'refreshToken'], r => {
      sendResponse({
        token: r.authToken || null,
        refreshToken: r.refreshToken || null,
      });
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

async function refreshAccessToken() {
  const { refreshToken } = await chrome.storage.local.get(['refreshToken']);
  if (!refreshToken) return null;

  const response = await fetch(
    CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.REFRESH_TOKEN,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    }
  );
  if (!response.ok) {
    await chrome.storage.local.remove(['authToken', 'refreshToken']);
    return null;
  }

  const tokens = await response.json();
  await chrome.storage.local.set({
    authToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });
  return tokens.access_token;
}

async function authorizedFetch(path, options = {}) {
  let { authToken } = await chrome.storage.local.get(['authToken']);
  if (!authToken) return null;

  const request = token => fetch(CONFIG.APPLYBOTPRO_DOMAIN + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  let response = await request(authToken);
  if (response.status === 401) {
    authToken = await refreshAccessToken();
    if (authToken) response = await request(authToken);
  }
  return response;
}

// ── Profile helpers ───────────────────────────────────────────────────────────

async function fetchUserProfile() {
  try {
    const res = await authorizedFetch(CONFIG.API_ENDPOINTS.GET_PROFILE);

    if (!res?.ok) return null;

    const result = await res.json();

    // Normalise → flat profile shape content.js expects
    const u = result.user || {};
    const p = result.profile || u.profile || {};

    const profile = {
      name:          p.full_name        || u.full_name        || u.email?.split('@')[0] || 'User',
      email:         u.email            || '',
      phone:         p.phone            || '',
      address:       p.address_line1    || p.address || '',
      address_line2: p.address_line2    || '',
      city:          p.city             || '',
      state:         p.state            || '',
      zip:           p.postal_code      || p.zip_code || '',
      country:       p.country          || '',
      linkedin_url:  p.linkedin_url     || '',
      portfolio_url: p.portfolio_url    || '',
      github_url:    p.github_url       || '',
      resume_text:   p.resume_text      || p.cv_text           || '',
      skills:        p.skills           || [],
      experience:    p.experience       || p.work_experience   || [],
      education:     p.education        || [],
      certifications:p.certifications   || [],
      projects:      p.projects         || [],
      tools:         p.tools            || [],
      languages:     p.languages        || [],
      awards:        p.awards           || [],
      volunteering:  p.volunteer_experience || [],
      publications:  p.publications     || [],
      courses:       p.courses          || [],
      interests:     p.interests        || [],
      years_experience: p.years_of_experience ?? null,
      additional_details: p.additional_details || {},
      summary:       p.summary          || p.bio               || '',
      job_title:     p.job_title        || p.headline || p.job_titles?.[0] || '',
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
    const res = await authorizedFetch(
      CONFIG.API_ENDPOINTS.AUTOFILL_PROXY,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields, job_context: jobContext }),
      }
    );

    if (!res) return { error: 'not_authenticated' };
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
    const res = await authorizedFetch(
      CONFIG.API_ENDPOINTS.TRACK_APPLICATION,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      }
    );

    if (res?.ok) {
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
