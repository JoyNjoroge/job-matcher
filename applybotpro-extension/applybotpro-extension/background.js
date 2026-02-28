// Background Service Worker for ApplyBotPro Extension
// Handles authentication, job tracking, and communication with website

importScripts('config.js');

// ============================================
// INITIALIZATION
// ============================================

chrome.runtime.onInstalled.addListener(async () => {
  console.log('ApplyBotPro Extension installed!');
  await syncAuthToken();
});

// ============================================
// AUTH SYNC
// ============================================

async function syncAuthToken() {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: new URL(CONFIG.APPLYBOTPRO_DOMAIN).hostname
    });
    const authCookie = cookies.find(c => c.name === CONFIG.AUTH.COOKIE_NAME);
    if (authCookie) {
      await chrome.storage.local.set({ authToken: authCookie.value, authMethod: 'cookie' });
      console.log('[Auth] Token synced from cookie');
      return authCookie.value;
    }
    return null;
  } catch (error) {
    console.error('[Auth] Error syncing token:', error);
    return null;
  }
}

// ============================================
// MESSAGE ROUTER
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.type === 'AUTH_TOKEN_FOUND') {
    // Content script found the token in localStorage on the applybotpro domain
    chrome.storage.local.set({
      authToken: request.token,
      authMethod: 'localStorage'
    });
    sendResponse({ success: true });
    return false;
  }

  if (request.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || null });
    });
    return true;
  }

  if (request.type === 'SYNC_AUTH') {
    syncAuthToken().then(token => sendResponse({ success: !!token }));
    return true;
  }

  if (request.type === 'GET_USER_PROFILE') {
    getUserProfile().then(profile => sendResponse({ profile }));
    return true;
  }

  if (request.type === 'TRACK_JOB_CLICKED') {
    trackJobFromWebsite(request.jobData);
    sendResponse({ success: true });
    return false;
  }

  if (request.type === 'MARK_APPLIED') {
    markJobAsApplied(request.applicationData);
    sendResponse({ success: true });
    return false;
  }
});

// ============================================
// PROFILE FETCH
// BUG FIX: The /api/auth/me endpoint returns:
//   { user: { id, email, ... }, profile: { ... } }
//   NOT: { success: true, data: { name, email, ... } }
// We now normalise the response into the flat shape
// the content.js autofill expects.
// ============================================

async function fetchUserProfile() {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) throw new Error('Not authenticated');

    const response = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.GET_PROFILE,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );

    if (!response.ok) {
      console.warn('[Profile] Fetch failed:', response.status);
      return null;
    }

    const result = await response.json();

    // ── Normalise the response shape ────────────────────────────────────────
    // Backend: GET /api/auth/me → { user: {...}, profile: {...} }
    // Extension expects a flat object with at least:
    //   name, email, phone, address, city, linkedin_url,
    //   portfolio_url, github_url, resume_text, skills, experience, education
    let profile = null;

    if (result.user || result.profile) {
      // Standard /api/auth/me response
      const u = result.user   || {};
      const p = result.profile || {};

      profile = {
        // Identity
        name:          u.full_name  || p.full_name  || u.email?.split('@')[0] || 'User',
        email:         u.email      || p.email      || '',
        phone:         p.phone      || u.phone      || '',
        // Location
        address:       p.address    || '',
        city:          p.city       || p.location   || '',
        state:         p.state      || '',
        zip:           p.zip_code   || '',
        country:       p.country    || '',
        // Social
        linkedin_url:  p.linkedin_url  || u.linkedin_url  || '',
        portfolio_url: p.portfolio_url || u.portfolio_url || '',
        github_url:    p.github_url    || u.github_url    || '',
        // Resume/Career data
        resume_text:   p.resume_text   || p.cv_text || '',
        skills:        p.skills        || [],
        experience:    p.experience    || p.work_experience || [],
        education:     p.education     || [],
        summary:       p.summary       || p.bio      || '',
        job_title:     p.job_title     || p.headline || '',
      };
    } else if (result.data) {
      // Old-style { success: true, data: {...} } — still handle gracefully
      profile = result.data;
    } else {
      console.warn('[Profile] Unexpected response shape:', result);
      return null;
    }

    // Cache for 5 minutes
    await chrome.storage.local.set({
      userProfile: profile,
      profileCachedAt: Date.now()
    });

    if (CONFIG.FEATURES.DEBUG_MODE) {
      console.log('[Profile] Fetched and cached:', profile);
    }

    return profile;
  } catch (error) {
    console.error('[Profile] Fetch error:', error);
    return null;
  }
}

async function getUserProfile() {
  const { userProfile, profileCachedAt } = await chrome.storage.local.get([
    'userProfile',
    'profileCachedAt'
  ]);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  if (userProfile && profileCachedAt && (Date.now() - profileCachedAt < CACHE_DURATION)) {
    return userProfile;
  }

  return await fetchUserProfile();
}

// ============================================
// JOB TRACKING
// ============================================

async function trackJobFromWebsite(jobData) {
  try {
    await chrome.storage.local.set({
      [`tracked_job_${jobData.jobId}`]: {
        ...jobData,
        trackedAt: Date.now()
      }
    });
    if (CONFIG.FEATURES.DEBUG_MODE) console.log('[Track] Job tracked:', jobData);
  } catch (error) {
    console.error('[Track] Error:', error);
  }
}

async function markJobAsApplied(applicationData) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) { console.error('[Apply] No auth token'); return; }

    const response = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.TRACK_APPLICATION,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(applicationData)
      }
    );

    const result = await response.json();

    if (response.ok) {
      await chrome.storage.local.remove(`tracked_job_${applicationData.job_id}`);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Application Tracked!',
        message: `Your application to ${applicationData.company} has been saved.`
      });
    } else {
      console.error('[Apply] Backend error:', result);
    }
  } catch (error) {
    console.error('[Apply] Error:', error);
  }
}

// ============================================
// TAB MONITORING
// ============================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const jobId = url.searchParams.get(CONFIG.JOB_ID_PARAM);
      if (jobId) {
        console.log('[Tab] Tracked job detected:', jobId);
        chrome.tabs.sendMessage(tabId, { type: 'ACTIVATE_AUTOFILL', jobId });
      }
    } catch (_) {}
  }
});

// Periodic auth token refresh (every 5 minutes)
setInterval(syncAuthToken, 5 * 60 * 1000);
