// Content Script - Runs on all web pages
// Detects forms and provides auto-fill assistance

// Import config (will be available globally)
let isActivated = false;
let currentJobId = null;
let userProfile = null;

// ============================================
// INITIALIZATION
// ============================================

// Check if we're on applybotpro domain to sync auth token
if (window.location.hostname.includes('applybotpro')) {
  // Try to get auth token from localStorage and send to background
  const authToken = localStorage.getItem(CONFIG.AUTH.LOCALSTORAGE_KEY);
  if (authToken) {
    chrome.runtime.sendMessage({
      type: 'AUTH_TOKEN_FOUND',
      token: authToken
    });
  }
}

// Check if this page has a tracked job ID in URL
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
  
  // Fetch user profile
  const response = await chrome.runtime.sendMessage({ type: 'GET_USER_PROFILE' });
  userProfile = response.profile;
  
  if (!userProfile) {
    console.error('Could not load user profile');
    return;
  }
  
  // Detect forms on the page
  detectForms();
  
  // Show floating assistant button
  showAssistantButton();
  
  console.log('Auto-fill activated for job:', jobId);
}

// ============================================
// FORM DETECTION
// ============================================

let detectedForms = [];

function detectForms() {
  // Find all forms on the page
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    if (inputs.length > 0) {
      detectedForms.push({
        form: form,
        inputs: Array.from(inputs)
      });
    }
  });
  
  // Also detect inputs not in forms (some sites don't use form tags)
  const standaloneInputs = document.querySelectorAll('input:not(form input), textarea:not(form textarea)');
  
  if (standaloneInputs.length > 0) {
    detectedForms.push({
      form: null,
      inputs: Array.from(standaloneInputs)
    });
  }
  
  console.log(`Detected ${detectedForms.length} form(s) with inputs`);
}

// ============================================
// FLOATING ASSISTANT BUTTON
// ============================================

function showAssistantButton() {
  // Check if button already exists
  if (document.getElementById('applybotpro-assistant')) {
    return;
  }
  
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
  // Check if panel already exists
  let panel = document.getElementById('applybotpro-panel');
  
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    return;
  }
  
  // Create panel
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
          Preview Data
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
  
  // Add event listeners
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
  resultsDiv.innerHTML = '<div class="applybotpro-loading">Analyzing form fields with AI...</div>';
  
  try {
    // Gather all form fields
    const formFields = [];
    
    detectedForms.forEach(formData => {
      formData.inputs.forEach(input => {
        if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
          const fieldInfo = {
            element: input,
            type: input.type || input.tagName.toLowerCase(),
            name: input.name || input.id || '',
            label: getFieldLabel(input),
            placeholder: input.placeholder || '',
            value: input.value || '',
            required: input.required || false
          };
          
          formFields.push(fieldInfo);
        }
      });
    });
    
    if (formFields.length === 0) {
      resultsDiv.innerHTML = '<div class="applybotpro-error">No form fields detected on this page.</div>';
      return;
    }
    
    // Use Gemini AI to match fields with user data
    const filledFields = await matchFieldsWithAI(formFields, userProfile);
    
    // Fill the fields
    let filledCount = 0;
    filledFields.forEach(field => {
      if (field.suggestedValue) {
        fillField(field.element, field.suggestedValue);
        filledCount++;
      }
    });
    
    resultsDiv.innerHTML = `
      <div class="applybotpro-success">
        ✓ Successfully filled ${filledCount} field(s)!
        <p class="applybotpro-tip">Review the filled information and submit when ready.</p>
      </div>
    `;
    
  } catch (error) {
    console.error('Error filling form:', error);
    resultsDiv.innerHTML = `<div class="applybotpro-error">Error: ${error.message}</div>`;
  }
}

// Get label for a form field
function getFieldLabel(input) {
  // Check for associated label
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
  }
  
  // Check for parent label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent.trim();
  
  // Check for aria-label
  if (input.getAttribute('aria-label')) {
    return input.getAttribute('aria-label');
  }
  
  // Check for nearby text
  const prevSibling = input.previousElementSibling;
  if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN')) {
    return prevSibling.textContent.trim();
  }
  
  return '';
}

// Use Gemini AI to intelligently match form fields with user data
async function matchFieldsWithAI(formFields, profile) {
  // Prepare form fields description for AI
  const fieldsDescription = formFields.map((field, index) => ({
    index: index,
    type: field.type,
    name: field.name,
    label: field.label,
    placeholder: field.placeholder
  }));
  
  // Create prompt for Gemini
  const prompt = `You are helping fill out a job application form. 

User Profile Data:
${JSON.stringify(profile, null, 2)}

Form Fields to Fill:
${JSON.stringify(fieldsDescription, null, 2)}

For each form field, determine the most appropriate value from the user's profile data. 
Return a JSON array with this structure:
[
  {
    "index": 0,
    "suggestedValue": "the value to fill",
    "confidence": "high/medium/low",
    "reasoning": "brief explanation"
  },
  ...
]

Rules:
- Only suggest values you're confident about
- For email, use the exact email from profile
- For phone, use the exact phone from profile
- For name fields, extract from the full name appropriately
- For text areas asking about experience, use relevant parts from resume
- For dropdowns/selects, return the option value that best matches
- If unsure, set suggestedValue to null

Return ONLY the JSON array, no other text.`;

  try {
    // Call Gemini API
    // NOTE: Replace with your actual Gemini API endpoint and key
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          }
        })
      }
    );
    
    const result = await response.json();
    const aiResponse = result.candidates[0].content.parts[0].text;
    
    // Parse AI response
    const suggestions = JSON.parse(aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    
    // Map suggestions back to form fields
    formFields.forEach((field, index) => {
      const suggestion = suggestions.find(s => s.index === index);
      if (suggestion) {
        field.suggestedValue = suggestion.suggestedValue;
        field.confidence = suggestion.confidence;
      }
    });
    
    return formFields;
    
  } catch (error) {
    console.error('AI matching error:', error);
    // Fallback to simple matching
    return simpleFieldMatching(formFields, profile);
  }
}

// Fallback simple field matching (if AI fails)
function simpleFieldMatching(formFields, profile) {
  formFields.forEach(field => {
    const fieldText = (field.label + ' ' + field.name + ' ' + field.placeholder).toLowerCase();
    
    // Simple keyword matching
    if (fieldText.includes('email') || fieldText.includes('e-mail')) {
      field.suggestedValue = profile.email;
    } else if (fieldText.includes('phone') || fieldText.includes('mobile') || fieldText.includes('tel')) {
      field.suggestedValue = profile.phone;
    } else if (fieldText.includes('first') && fieldText.includes('name')) {
      field.suggestedValue = profile.name?.split(' ')[0];
    } else if (fieldText.includes('last') && fieldText.includes('name')) {
      field.suggestedValue = profile.name?.split(' ').slice(1).join(' ');
    } else if (fieldText.includes('full') && fieldText.includes('name')) {
      field.suggestedValue = profile.name;
    } else if (fieldText.includes('address')) {
      field.suggestedValue = profile.address;
    } else if (fieldText.includes('city')) {
      field.suggestedValue = profile.city;
    } else if (fieldText.includes('linkedin')) {
      field.suggestedValue = profile.linkedin_url;
    } else if (fieldText.includes('portfolio') || fieldText.includes('website')) {
      field.suggestedValue = profile.portfolio_url;
    }
  });
  
  return formFields;
}

// Fill individual field
function fillField(element, value) {
  if (!value) return;
  
  // Handle different input types
  if (element.tagName === 'SELECT') {
    // Try to find matching option
    const options = Array.from(element.options);
    const match = options.find(opt => 
      opt.value.toLowerCase() === value.toLowerCase() ||
      opt.text.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      element.value = match.value;
    }
  } else if (element.type === 'checkbox') {
    element.checked = Boolean(value);
  } else if (element.type === 'radio') {
    if (element.value === value) {
      element.checked = true;
    }
  } else {
    // Text inputs, textareas, etc.
    element.value = value;
    
    // Trigger change event for frameworks like React
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  }
  
  // Add visual feedback
  element.style.backgroundColor = '#e8f5e9';
  setTimeout(() => {
    element.style.backgroundColor = '';
  }, 2000);
}

// ============================================
// PREVIEW USER DATA
// ============================================

function previewData() {
  const resultsDiv = document.getElementById('applybotpro-results');
  
  if (!userProfile) {
    resultsDiv.innerHTML = '<div class="applybotpro-error">No profile data loaded</div>';
    return;
  }
  
  resultsDiv.innerHTML = `
    <div class="applybotpro-preview">
      <h4>Your Profile Data:</h4>
      <pre>${JSON.stringify(userProfile, null, 2)}</pre>
    </div>
  `;
}

// ============================================
// MARK JOB AS APPLIED
// ============================================

async function markAsApplied() {
  const resultsDiv = document.getElementById('applybotpro-results');
  resultsDiv.innerHTML = '<div class="applybotpro-loading">Saving application...</div>';
  
  try {
    // Extract job info from page
    const jobTitle = document.querySelector('h1')?.textContent || 'Unknown Position';
    const company = document.querySelector('[class*="company"]')?.textContent || 'Unknown Company';
    
    const applicationData = {
      job_id: currentJobId,
      job_title: jobTitle,
      company: company,
      application_url: window.location.href,
      applied_at: new Date().toISOString(),
      status: 'applied'
    };
    
    // Send to background script
    await chrome.runtime.sendMessage({
      type: 'MARK_APPLIED',
      applicationData: applicationData
    });
    
    resultsDiv.innerHTML = `
      <div class="applybotpro-success">
        ✓ Application saved successfully!
        <p>This job has been added to your applications in ApplyBotPro.</p>
      </div>
    `;
    
  } catch (error) {
    console.error('Error marking as applied:', error);
    resultsDiv.innerHTML = `<div class="applybotpro-error">Error: ${error.message}</div>`;
  }
}

// Log when content script loads
console.log('ApplyBotPro extension loaded');
