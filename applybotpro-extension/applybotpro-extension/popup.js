// Popup Script - Controls the extension popup UI

// Import config
// Note: In popup, we need to load config differently
let CONFIG;

// Load config
fetch(chrome.runtime.getURL('config.js'))
  .then(response => response.text())
  .then(text => {
    eval(text);
    initPopup();
  });

function initPopup() {
  // Check authentication status
  checkAuthStatus();
  
  // Check if current tab has active job
  checkActiveJob();
  
  // Set up event listeners
  document.getElementById('open-website').addEventListener('click', () => {
    chrome.tabs.create({ url: CONFIG.APPLYBOTPRO_DOMAIN });
  });
  
  document.getElementById('refresh-auth').addEventListener('click', async () => {
    // Request background script to sync auth token
    chrome.runtime.sendMessage({ type: 'SYNC_AUTH' }, (response) => {
      checkAuthStatus();
    });
  });
  
  document.getElementById('help-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: CONFIG.APPLYBOTPRO_DOMAIN + '/help' });
  });
}

// Check if user is authenticated
async function checkAuthStatus() {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    const authIndicator = document.getElementById('auth-indicator');
    const authStatus = document.getElementById('auth-status');
    
    if (authToken) {
      authIndicator.classList.remove('inactive');
      authStatus.textContent = 'Connected to ApplyBotPro';
      
      // Also fetch user profile to verify token is valid
      chrome.runtime.sendMessage({ type: 'GET_USER_PROFILE' }, (response) => {
        if (response && response.profile) {
          authStatus.textContent = `Connected as ${response.profile.name || 'User'}`;
        }
      });
    } else {
      authIndicator.classList.add('inactive');
      authStatus.textContent = 'Not connected - Please log in';
      
      document.getElementById('info-message').innerHTML = 
        '<strong>⚠️ Not Connected</strong><br>Please log in to ApplyBotPro to use the extension.';
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
}

// Check if current tab has an active tracked job
async function checkActiveJob() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) return;
    
    // Check if URL contains job tracking parameter
    const url = new URL(tab.url);
    const jobId = url.searchParams.get(CONFIG.JOB_ID_PARAM);
    
    const jobIndicator = document.getElementById('job-indicator');
    const jobStatus = document.getElementById('job-status');
    const infoMessage = document.getElementById('info-message');
    
    if (jobId) {
      jobIndicator.classList.remove('inactive');
      jobStatus.textContent = 'Active job detected!';
      
      infoMessage.innerHTML = 
        '<strong>✓ Ready to help!</strong><br>Click "Fill Application" button on the page to auto-fill the form.';
    } else {
      // Check if we're on applybotpro
      if (tab.url.includes(new URL(CONFIG.APPLYBOTPRO_DOMAIN).hostname)) {
        infoMessage.innerHTML = 
          '<strong>Welcome!</strong><br>Click "Apply" on any job to activate the assistant on the application page.';
      }
    }
  } catch (error) {
    console.error('Error checking active job:', error);
  }
}

// Update status every 2 seconds while popup is open
setInterval(() => {
  checkAuthStatus();
  checkActiveJob();
}, 2000);
