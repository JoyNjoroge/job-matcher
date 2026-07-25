// background.js — Firefox MV2 Background Page
// config.js is already loaded before this file via manifest "scripts" array.
// No importScripts needed — this is a regular JS environment, not a service worker.

// ── Init ──────────────────────────────────────────────────────────────────────

browser.runtime.onInstalled.addListener(async () => {
  console.log('[CandorApply] Extension installed v1.1 (Firefox)');
  await syncAuthToken();
});

// ── Auth sync ─────────────────────────────────────────────────────────────────

async function syncAuthToken() {
  try {
    // Ask any open CandorApply tab to read localStorage for us
    const tabs = await browser.tabs.query({ url: CONFIG.FRONTEND_URL + '/*' });
    if (tabs.length > 0) {
      browser.tabs.sendMessage(tabs[0].id, { type: 'READ_LOCAL_STORAGE' });
      return;
    }
    // Fallback: cookie
    const hostname = new URL(CONFIG.APPLYBOTPRO_DOMAIN).hostname;
    const cookies  = await browser.cookies.getAll({ domain: hostname });
    const auth     = cookies.find(c => c.name === CONFIG.AUTH.COOKIE_NAME);
    if (auth) {
      await browser.storage.local.set({ authToken: auth.value });
      console.log('[Auth] Token from cookie');
    }
  } catch (e) {
    console.error('[Auth] syncAuthToken error:', e);
  }
}

// ── Message router ────────────────────────────────────────────────────────────

browser.runtime.onMessage.addListener((request, sender) => {

  if (request.type === 'AUTH_TOKEN_FOUND') {
    browser.storage.local.set({ authToken: request.token });
    return Promise.resolve({ success: true });
  }

  if (request.type === 'GET_AUTH_TOKEN') {
    return browser.storage.local.get(['authToken'])
      .then(r => ({ token: r.authToken || null }));
  }

  if (request.type === 'SYNC_AUTH') {
    return syncAuthToken().then(() => ({ success: true }));
  }

  if (request.type === 'GET_USER_PROFILE') {
    return getUserProfile().then(profile => ({ profile }));
  }

  if (request.type === 'AUTOFILL_WITH_AI') {
    return autofillWithBackend(request.fields, request.jobContext);
  }

  if (request.type === 'TRACK_JOB_CLICKED') {
    browser.storage.local.set({
      [`tracked_job_${request.jobData.jobId}`]: {
        ...request.jobData,
        trackedAt: Date.now(),
      },
    });
    return Promise.resolve({ success: true });
  }

  if (request.type === 'MARK_APPLIED') {
    return markJobAsApplied(request.applicationData)
      .then(ok => ({ success: ok }));
  }
});

// ── Profile helpers ───────────────────────────────────────────────────────────

async function fetchUserProfile() {
  try {
    const { authToken } = await browser.storage.local.get(['authToken']);
    if (!authToken) return null;

    const res = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.GET_PROFILE,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    if (!res.ok) return null;

    const result = await res.json();
    const u = result.user    || {};
    const p = result.profile || {};

    const profile = {
      name:          u.full_name        || p.full_name        || u.email?.split('@')[0] || 'User',
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

    await browser.storage.local.set({
      userProfile:     profile,
      profileCachedAt: Date.now(),
    });
    return profile;
  } catch (e) {
    console.error('[Profile] fetchUserProfile error:', e);
    return null;
  }
}

async function getUserProfile() {
  const { userProfile, profileCachedAt } = await browser.storage.local.get([
    'userProfile', 'profileCachedAt',
  ]);
  const FIVE_MIN = 5 * 60 * 1000;
  if (userProfile && profileCachedAt && Date.now() - profileCachedAt < FIVE_MIN) {
    return userProfile;
  }
  return fetchUserProfile();
}

// ── AI autofill via backend proxy ─────────────────────────────────────────────

async function autofillWithBackend(fields, jobContext = {}) {
  try {
    const { authToken } = await browser.storage.local.get(['authToken']);
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
    return await res.json();
  } catch (e) {
    console.error('[AutoFill] Backend proxy error:', e);
    return { error: e.message };
  }
}

// ── Mark applied ──────────────────────────────────────────────────────────────

async function markJobAsApplied(applicationData) {
  try {
    const { authToken } = await browser.storage.local.get(['authToken']);
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
      await browser.storage.local.remove(`tracked_job_${applicationData.job_id}`);
      browser.notifications.create({
        type:    'basic',
        iconUrl: 'icons/icon48.png',
        title:   'Application tracked!',
        message: `${applicationData.job_title} at ${applicationData.company} saved.`,
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Apply] error:', e);
    return false;
  }
}

// ── Tab monitoring ────────────────────────────────────────────────────────────

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  try {
    const url   = new URL(tab.url);
    const jobId = url.searchParams.get(CONFIG.JOB_ID_PARAM);
    if (jobId) browser.tabs.sendMessage(tabId, { type: 'ACTIVATE_AUTOFILL', jobId });
  } catch (_) {}
});

// Refresh token every 5 min
setInterval(syncAuthToken, 5 * 60 * 1000);
