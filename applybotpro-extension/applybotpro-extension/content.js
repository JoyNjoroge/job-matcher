// Content Script - Runs on all web pages
// Detects forms and provides AI-powered auto-fill using ApplyBotPro profile data

let isActivated = false;
let currentJobId = null;
let userProfile = null;

// ============================================
// INITIALIZATION
// ============================================

// Sync auth token when on the ApplyBotPro domain
if (window.location.hostname.includes('applybotpro')) {
  const authToken = localStorage.getItem(CONFIG.AUTH.LOCALSTORAGE_KEY);
  if (authToken) {
    chrome.runtime.sendMessage({ type: 'AUTH_TOKEN_FOUND', token: authToken });
  }
}

// Check for tracked job ID in URL and auto-activate
const urlParams = new URLSearchParams(window.location.search);
const jobIdFromUrl = urlParams.get(CONFIG.JOB_ID_PARAM);
if (jobIdFromUrl) {
  activateAutoFill(jobIdFromUrl);
}

// ============================================
// MESSAGE LISTENERS
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ACTIVATE_AUTOFILL') {
    activateAutoFill(request.jobId);
    sendResponse({ success: true });
  }
});

// ============================================
// AUTO-FILL ACTIVATION
// ============================================

async function activateAutoFill(jobId) {
  isActivated = true;
  currentJobId = jobId;

  const response = await chrome.runtime.sendMessage({ type: 'GET_USER_PROFILE' });
  userProfile = response.profile;

  if (!userProfile) {
    console.error('[AutoFill] Could not load user profile — is the user logged in?');
    return;
  }

  detectForms();
  showAssistantButton();

  if (CONFIG.FEATURES.DEBUG_MODE) {
    console.log('[AutoFill] Activated for job:', jobId, '| Profile:', userProfile.name);
  }
}

// ============================================
// FORM DETECTION
// ============================================

let detectedForms = [];

function detectForms() {
  detectedForms = [];

  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');
    if (inputs.length > 0) {
      detectedForms.push({ form, inputs: Array.from(inputs) });
    }
  });

  // Also catch standalone inputs (e.g. React portals, Greenhouse, Lever)
  const allInputs = document.querySelectorAll('input, textarea, select');
  const inFormInputs = new Set(document.querySelectorAll('form input, form textarea, form select'));
  const standalone = Array.from(allInputs).filter(el => !inFormInputs.has(el));
  if (standalone.length > 0) {
    detectedForms.push({ form: null, inputs: standalone });
  }

  if (CONFIG.FEATURES.DEBUG_MODE) {
    console.log(`[AutoFill] Detected ${detectedForms.length} form group(s)`);
  }
}

// ============================================
// FLOATING ASSISTANT BUTTON
// ============================================

function showAssistantButton() {
  if (document.getElementById('applybotpro-assistant')) return;

  const button = document.createElement('div');
  button.id = 'applybotpro-assistant';
  button.className = 'applybotpro-floating-btn';
  button.innerHTML = `
    <div class="applybotpro-btn-content">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      <span>Fill Application</span>
    </div>
  `;
  button.addEventListener('click', openAssistantPanel);
  document.body.appendChild(button);
}

// ============================================
// ASSISTANT PANEL
// ============================================

function openAssistantPanel() {
  let panel = document.getElementById('applybotpro-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    return;
  }

  panel = document.createElement('div');
  panel.id = 'applybotpro-panel';
  panel.className = 'applybotpro-panel';
  panel.innerHTML = `
    <div class="applybotpro-panel-header">
      <h3>ApplyBotPro Assistant</h3>
      <button id="applybotpro-close" class="applybotpro-close-btn">×</button>
    </div>
    <div class="applybotpro-panel-content">
      <div class="applybotpro-status">
        <p>✓ Connected to your profile</p>
        <p class="applybotpro-user-name">${userProfile?.name || 'User'}</p>
        ${userProfile?.email ? `<p style="font-size:12px;color:#999;margin-top:2px">${userProfile.email}</p>` : ''}
      </div>

      <div class="applybotpro-actions">
        <button id="applybotpro-fill-btn" class="applybotpro-action-btn primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          Smart Fill Form
        </button>

        <button id="applybotpro-preview-btn" class="applybotpro-action-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Preview Profile Data
        </button>

        <button id="applybotpro-mark-applied-btn" class="applybotpro-action-btn success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Mark as Applied
        </button>
      </div>

      <div id="applybotpro-results" class="applybotpro-results"></div>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById('applybotpro-close').addEventListener('click', () => {
    panel.style.display = 'none';
  });
  document.getElementById('applybotpro-fill-btn').addEventListener('click', fillFormWithAI);
  document.getElementById('applybotpro-preview-btn').addEventListener('click', previewData);
  document.getElementById('applybotpro-mark-applied-btn').addEventListener('click', markAsApplied);
}

// ============================================
// SMART FORM FILLING WITH GEMINI AI
// ============================================

async function fillFormWithAI() {
  const resultsDiv = document.getElementById('applybotpro-results');
  resultsDiv.innerHTML = '<div class="applybotpro-loading">Analyzing form fields with AI…</div>';

  // Re-detect in case DOM changed (SPAs)
  detectForms();

  const formFields = [];
  detectedForms.forEach(formData => {
    formData.inputs.forEach(input => {
      if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
        formFields.push({
          element:     input,
          type:        input.type || input.tagName.toLowerCase(),
          name:        input.name || input.id || '',
          label:       getFieldLabel(input),
          placeholder: input.placeholder || '',
          value:       input.value || '',
          required:    input.required || false,
        });
      }
    });
  });

  if (formFields.length === 0) {
    resultsDiv.innerHTML = '<div class="applybotpro-error">No form fields detected on this page. Try scrolling to the application form first.</div>';
    return;
  }

  try {
    // Try AI first, fall back to simple matching
    let filledFields;
    if (CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
      filledFields = await matchFieldsWithAI(formFields, userProfile);
    } else {
      filledFields = simpleFieldMatching(formFields, userProfile);
    }

    let filledCount = 0;
    filledFields.forEach(field => {
      if (field.suggestedValue) {
        fillField(field.element, field.suggestedValue);
        filledCount++;
      }
    });

    if (filledCount === 0) {
      resultsDiv.innerHTML = '<div class="applybotpro-error">Could not match any fields automatically. Try using "Preview Profile Data" to check your profile has the needed info.</div>';
    } else {
      resultsDiv.innerHTML = `
        <div class="applybotpro-success">
          ✓ Filled ${filledCount} field${filledCount > 1 ? 's' : ''}!
          <p class="applybotpro-tip">Review and correct any field before submitting.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[AutoFill] Error:', error);
    resultsDiv.innerHTML = `<div class="applybotpro-error">Error: ${error.message}</div>`;
  }
}

// Get the human-readable label for an input field
function getFieldLabel(input) {
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
  }
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent.replace(input.value, '').trim();
  if (input.getAttribute('aria-label')) return input.getAttribute('aria-label');
  if (input.getAttribute('aria-labelledby')) {
    const el = document.getElementById(input.getAttribute('aria-labelledby'));
    if (el) return el.textContent.trim();
  }
  const prev = input.previousElementSibling;
  if (prev && ['LABEL','SPAN','P','DIV'].includes(prev.tagName)) return prev.textContent.trim();
  return '';
}

// Gemini AI-powered field matching
async function matchFieldsWithAI(formFields, profile) {
  const fieldsDescription = formFields.map((field, index) => ({
    index,
    type:        field.type,
    name:        field.name,
    label:       field.label,
    placeholder: field.placeholder,
  }));

  const prompt = `You are helping fill out a job application form.

User Profile Data:
${JSON.stringify(profile, null, 2)}

Form Fields to Fill:
${JSON.stringify(fieldsDescription, null, 2)}

For each form field, determine the best value from the user's profile.
Return ONLY a JSON array (no markdown, no explanation):
[
  {
    "index": 0,
    "suggestedValue": "value or null",
    "confidence": "high|medium|low"
  }
]

Rules:
- email: exact match from profile.email
- phone: exact match from profile.phone
- first name: first word of profile.name
- last name: remaining words of profile.name
- full name: profile.name
- linkedin: profile.linkedin_url
- portfolio/website: profile.portfolio_url
- github: profile.github_url
- address: profile.address
- city: profile.city
- summary/cover/about: profile.summary or first 300 chars of profile.resume_text
- skills: comma-joined profile.skills array
- If unsure → null`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    }
  );

  const result  = await response.json();
  const aiText  = result.candidates[0].content.parts[0].text;
  const cleaned = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const suggestions = JSON.parse(cleaned);

  formFields.forEach((field, index) => {
    const s = suggestions.find(s => s.index === index);
    if (s) {
      field.suggestedValue = s.suggestedValue;
      field.confidence     = s.confidence;
    }
  });

  return formFields;
}

// ============================================
// SIMPLE FIELD MATCHING (AI fallback)
// Uses the normalised profile shape from background.js
// profile.name, .email, .phone, .city, .linkedin_url, etc.
// ============================================

function simpleFieldMatching(formFields, profile) {
  const nameParts   = (profile.name || '').split(' ');
  const firstName   = nameParts[0] || '';
  const lastName    = nameParts.slice(1).join(' ') || '';
  const skillsStr   = Array.isArray(profile.skills) ? profile.skills.join(', ') : '';
  const summaryText = profile.summary || (profile.resume_text || '').substring(0, 400);

  formFields.forEach(field => {
    const key = (field.label + ' ' + field.name + ' ' + field.placeholder).toLowerCase();

    if      (key.includes('email') || key.includes('e-mail'))           field.suggestedValue = profile.email;
    else if (key.includes('phone') || key.includes('mobile') || key.includes('tel')) field.suggestedValue = profile.phone;
    else if (key.includes('first') && key.includes('name'))             field.suggestedValue = firstName;
    else if (key.includes('last')  && key.includes('name'))             field.suggestedValue = lastName;
    else if (key.includes('full')  && key.includes('name'))             field.suggestedValue = profile.name;
    else if (key.includes('name') && !key.includes('company') && !key.includes('user')) field.suggestedValue = profile.name;
    else if (key.includes('city'))                                       field.suggestedValue = profile.city;
    else if (key.includes('address'))                                    field.suggestedValue = profile.address;
    else if (key.includes('state') || key.includes('province'))         field.suggestedValue = profile.state;
    else if (key.includes('zip')   || key.includes('postal'))           field.suggestedValue = profile.zip;
    else if (key.includes('country'))                                    field.suggestedValue = profile.country;
    else if (key.includes('linkedin'))                                   field.suggestedValue = profile.linkedin_url;
    else if (key.includes('github'))                                     field.suggestedValue = profile.github_url;
    else if (key.includes('portfolio') || key.includes('website') || key.includes('personal site')) field.suggestedValue = profile.portfolio_url;
    else if (key.includes('skill'))                                      field.suggestedValue = skillsStr;
    else if (key.includes('summary') || key.includes('cover') || key.includes('about') || key.includes('bio') || key.includes('introduce')) field.suggestedValue = summaryText;
    else if (key.includes('title') || key.includes('position') || key.includes('role') || key.includes('headline')) field.suggestedValue = profile.job_title;
  });

  return formFields;
}

// Fill a single field (handles React/Vue controlled inputs)
function fillField(element, value) {
  if (!value) return;

  if (element.tagName === 'SELECT') {
    const options = Array.from(element.options);
    const match   = options.find(opt =>
      opt.value.toLowerCase() === value.toLowerCase() ||
      opt.text.toLowerCase()  === value.toLowerCase()
    );
    if (match) element.value = match.value;
  } else if (element.type === 'checkbox') {
    element.checked = Boolean(value);
  } else if (element.type === 'radio') {
    if (element.value === value) element.checked = true;
  } else {
    element.value = value;
    // React / Vue need these events to update their state
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    const nativeTextAreaSetter   = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    const setter = element.tagName === 'TEXTAREA' ? nativeTextAreaSetter : nativeInputValueSetter;
    if (setter) setter.call(element, value);
    element.dispatchEvent(new Event('input',  { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Subtle green flash to show what was filled
  const original = element.style.backgroundColor;
  element.style.transition = 'background-color 0.3s';
  element.style.backgroundColor = '#e8f5e9';
  setTimeout(() => { element.style.backgroundColor = original; }, 1800);
}

// ============================================
// PREVIEW PROFILE DATA
// ============================================

function previewData() {
  const resultsDiv = document.getElementById('applybotpro-results');
  if (!userProfile) {
    resultsDiv.innerHTML = '<div class="applybotpro-error">No profile data loaded. Make sure you\'re logged in to ApplyBotPro.</div>';
    return;
  }

  // Show friendly summary, not raw JSON
  const skills = Array.isArray(userProfile.skills) ? userProfile.skills.slice(0, 8).join(', ') : '—';
  resultsDiv.innerHTML = `
    <div class="applybotpro-preview">
      <h4>Profile loaded ✓</h4>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        ${[
          ['Name',      userProfile.name],
          ['Email',     userProfile.email],
          ['Phone',     userProfile.phone || '—'],
          ['City',      userProfile.city  || '—'],
          ['LinkedIn',  userProfile.linkedin_url || '—'],
          ['GitHub',    userProfile.github_url   || '—'],
          ['Portfolio', userProfile.portfolio_url || '—'],
          ['Title',     userProfile.job_title    || '—'],
          ['Skills',    skills || '—'],
        ].map(([label, val]) => `
          <tr>
            <td style="padding:5px 8px 5px 0;color:#666;white-space:nowrap;font-weight:600">${label}</td>
            <td style="padding:5px 0;color:#333;word-break:break-all">${val}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
}

// ============================================
// MARK JOB AS APPLIED
// ============================================

async function markAsApplied() {
  const resultsDiv = document.getElementById('applybotpro-results');
  resultsDiv.innerHTML = '<div class="applybotpro-loading">Saving application…</div>';

  try {
    const jobTitle = document.querySelector('h1')?.textContent?.trim() || 'Unknown Position';
    const company  =
      document.querySelector('[class*="company"]')?.textContent?.trim() ||
      document.querySelector('[data-company]')?.textContent?.trim() ||
      'Unknown Company';

    const applicationData = {
      job_id:          currentJobId,
      job_title:       jobTitle,
      company:         company,
      application_url: window.location.href,
      applied_at:      new Date().toISOString(),
      status:          'applied',
      source:          'extension',
    };

    await chrome.runtime.sendMessage({ type: 'MARK_APPLIED', applicationData });

    resultsDiv.innerHTML = `
      <div class="applybotpro-success">
        ✓ Application saved to ApplyBotPro!
        <p class="applybotpro-tip">Check your Applications tab to track your progress.</p>
      </div>
    `;
  } catch (error) {
    console.error('[Apply] Error marking as applied:', error);
    resultsDiv.innerHTML = `<div class="applybotpro-error">Error: ${error.message}</div>`;
  }
}

console.log('[ApplyBotPro] Content script loaded');
