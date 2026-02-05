// Background Service Worker for ApplyBotPro Extension
// Handles authentication, job tracking, and communication with website

// Import config
importScripts('config.js');

// ============================================
// AUTHENTICATION & SYNC WITH APPLYBOTPRO
// ============================================

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ApplyBotPro Extension installed!');
  
  // Try to sync auth token from website
  await syncAuthToken();
});

// Check and sync auth token from applybotpro website
async function syncAuthToken() {
  try {
    // Method 1: Check cookies
    const cookies = await chrome.cookies.getAll({
      domain: new URL(CONFIG.APPLYBOTPRO_DOMAIN).hostname
    });
    
    const authCookie = cookies.find(c => c.name === CONFIG.AUTH.COOKIE_NAME);
    
    if (authCookie) {
      await chrome.storage.local.set({ 
        authToken: authCookie.value,
        authMethod: 'cookie'
      });
      console.log('Auth token synced from cookie');
      return authCookie.value;
    }
    
    // Method 2: Check localStorage (requires content script)
    // This will be handled by injected script on applybotpro domain
    
    return null;
  } catch (error) {
    console.error('Error syncing auth token:', error);
    return null;
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'AUTH_TOKEN_FOUND') {
    // Content script found auth token in localStorage
    chrome.storage.local.set({ 
      authToken: request.token,
      authMethod: 'localStorage'
    });
    sendResponse({ success: true });
  }
  
  if (request.type === 'GET_AUTH_TOKEN') {
    // Content script requesting auth token
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || null });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'TRACK_JOB_CLICKED') {
    // User clicked Apply on applybotpro - track this job
    trackJobFromWebsite(request.jobData);
    sendResponse({ success: true });
  }
  
  if (request.type === 'MARK_APPLIED') {
    // User completed application - send to backend
    markJobAsApplied(request.applicationData);
    sendResponse({ success: true });
    return true;
  }
});

// Track job when user clicks Apply on applybotpro
async function trackJobFromWebsite(jobData) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    // Store job data locally for when user reaches application page
    await chrome.storage.local.set({
      [`tracked_job_${jobData.jobId}`]: {
        ...jobData,
        trackedAt: Date.now()
      }
    });
    
    if (CONFIG.FEATURES.DEBUG_MODE) {
      console.log('Job tracked:', jobData);
    }
  } catch (error) {
    console.error('Error tracking job:', error);
  }
}

// Mark job as applied and sync with backend
async function markJobAsApplied(applicationData) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    if (!authToken) {
      console.error('No auth token available');
      return;
    }
    
    // Call your backend API to track application
    const response = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.TRACK_APPLICATION,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Adjust auth header format as needed
        },
        body: JSON.stringify(applicationData)
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Application tracked successfully:', result);
      
      // Remove from local tracking
      await chrome.storage.local.remove(`tracked_job_${applicationData.job_id}`);
      
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Application Tracked!',
        message: `Your application to ${applicationData.company} has been saved.`
      });
    }
  } catch (error) {
    console.error('Error marking job as applied:', error);
  }
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

// Fetch user profile data from applybotpro
async function fetchUserProfile() {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    if (!authToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(
      CONFIG.APPLYBOTPRO_DOMAIN + CONFIG.API_ENDPOINTS.GET_PROFILE,
      {
        headers: {
          'Authorization': `Bearer ${authToken}` // Adjust auth header format as needed
        }
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      // Cache profile data
      await chrome.storage.local.set({ 
        userProfile: result.data,
        profileCachedAt: Date.now()
      });
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Get cached profile or fetch fresh
async function getUserProfile() {
  const { userProfile, profileCachedAt } = await chrome.storage.local.get([
    'userProfile',
    'profileCachedAt'
  ]);
  
  // Cache for 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;
  
  if (userProfile && profileCachedAt && (Date.now() - profileCachedAt < CACHE_DURATION)) {
    return userProfile;
  }
  
  // Cache expired or doesn't exist, fetch fresh
  return await fetchUserProfile();
}

// Expose API for content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_USER_PROFILE') {
    getUserProfile().then(profile => {
      sendResponse({ profile });
    });
    return true;
  }
});

// ============================================
// TAB MONITORING
// ============================================

// Monitor when user navigates to job application pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if URL contains job tracking parameter
    const url = new URL(tab.url);
    const jobId = url.searchParams.get(CONFIG.JOB_ID_PARAM);
    
    if (jobId) {
      // This is a tracked job from applybotpro
      console.log('Tracked job detected:', jobId);
      
      // Inject content script to activate auto-fill
      chrome.tabs.sendMessage(tabId, {
        type: 'ACTIVATE_AUTOFILL',
        jobId: jobId
      });
    }
  }
});

// Periodic auth token check (every 5 minutes)
setInterval(syncAuthToken, 5 * 60 * 1000);
