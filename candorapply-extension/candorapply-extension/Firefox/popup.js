// popup.js — CONFIG is already loaded via <script src="config.js"> in popup.html

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  checkActiveTab();

  document.getElementById('btn-open').addEventListener('click', () => {
    chrome.tabs.create({ url: CONFIG.FRONTEND_URL });
  });

  document.getElementById('btn-assistant').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type: 'OPEN_ASSISTANT' }, () => {
      // Restricted browser pages cannot receive content-script messages.
      if (chrome.runtime.lastError) {
        const info = document.getElementById('info-message');
        info.textContent = 'CandorApply cannot run on browser settings or extension-store pages.';
        return;
      }
      window.close();
    });
  });

  document.getElementById('btn-refresh').addEventListener('click', () => {
    const btn = document.getElementById('btn-refresh');
    btn.textContent = 'Refreshing…';
    btn.disabled    = true;
    chrome.runtime.sendMessage({ type: 'SYNC_AUTH' }, () => {
      setTimeout(() => {
        btn.textContent = '↻ Refresh Connection';
        btn.disabled    = false;
        checkAuth();
      }, 800);
    });
  });

  document.getElementById('btn-help').addEventListener('click', () => {
    chrome.tabs.create({ url: CONFIG.FRONTEND_URL + '/profile' });
  });
});

// ── Auth status ────────────────────────────────────────────────────────────────

async function checkAuth() {
  const authDot    = document.getElementById('auth-dot');
  const authStatus = document.getElementById('auth-status');
  const nameRow    = document.getElementById('name-row');
  const authName   = document.getElementById('auth-name');

  const { authToken } = await chrome.storage.local.get(['authToken']);

  if (!authToken) {
    authDot.className    = 'dot';
    authStatus.textContent = 'Not connected — please log in';
    nameRow.style.display  = 'none';
    document.getElementById('info-message').innerHTML =
      '<strong style="color:#EF4444">⚠ Not connected.</strong><br>Log in to CandorApply, then click Refresh Connection.';
    return;
  }

  // Token exists — verify by fetching profile
  chrome.runtime.sendMessage({ type: 'GET_USER_PROFILE' }, res => {
    if (res?.profile) {
      authDot.className    = 'dot active';
      authStatus.textContent = 'Connected';
      nameRow.style.display  = 'flex';
      authName.textContent   = res.profile.name || res.profile.email || 'User';
    } else {
      authDot.className    = 'dot warn';
      authStatus.textContent = 'Token expired — please log in again';
      nameRow.style.display  = 'none';
    }
  });
}

// ── Active tab job detection ───────────────────────────────────────────────────

async function checkActiveTab() {
  const jobDot    = document.getElementById('job-dot');
  const jobStatus = document.getElementById('job-status');
  const infoBox   = document.getElementById('info-message');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  try {
    const url   = new URL(tab.url);
    const jobId = url.searchParams.get(CONFIG.JOB_ID_PARAM);

    if (jobId) {
      jobDot.className   = 'dot active';
      jobStatus.textContent = 'Tracked job detected!';
      infoBox.innerHTML  = '✓ <strong>Ready to fill.</strong><br>Click the AutoFill button floating on the page.';
      return;
    }

    // On a known job board?
    const jobBoards = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'greenhouse.io',
                       'lever.co', 'workday.com', 'myworkdayjobs.com', 'jobvite.com',
                       'smartrecruiters.com', 'careers.', 'jobs.'];
    const isJobBoard = jobBoards.some(b => url.hostname.includes(b) || url.pathname.includes(b));

    if (isJobBoard) {
      jobDot.className   = 'dot warn';
      jobStatus.textContent = 'Job page detected';
      infoBox.innerHTML  = 'Select <strong>Open assistant on this page</strong> to review and fill this application.';
    } else if (url.hostname === new URL(CONFIG.FRONTEND_URL).hostname) {
      jobDot.className   = 'dot active';
      jobStatus.textContent = 'CandorApply dashboard';
      infoBox.innerHTML  = 'Click Apply on any job to activate AutoFill on the application page.';
    }
  } catch (_) {}
}

// Refresh status every 3s while popup is open
setInterval(() => {
  checkAuth();
  checkActiveTab();
}, 3000);
