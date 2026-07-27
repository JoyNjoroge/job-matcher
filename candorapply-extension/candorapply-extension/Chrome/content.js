// Content Script — runs on all pages after config.js
// Detects job application forms and provides AI-powered autofill.

let isActivated   = false;
let currentJobId  = null;
let userProfile   = null;
let pendingFields = [];

// ── Auth token bridge ─────────────────────────────────────────────────────────
// When on the CandorApply frontend, read the token from localStorage
// and hand it to the background service worker (which can't access localStorage).

const isCandorApplyFrontend = (() => {
  try {
    return window.location.hostname === new URL(CONFIG.FRONTEND_URL).hostname;
  } catch (_) {
    return false;
  }
})();

let lastReportedToken = null;
function reportWebsiteAuth() {
  if (!isCandorApplyFrontend) return;
  const token = localStorage.getItem(CONFIG.AUTH.LOCALSTORAGE_KEY);
  const refreshToken = localStorage.getItem(CONFIG.AUTH.REFRESH_KEY);
  if (token && token !== lastReportedToken) {
    lastReportedToken = token;
    chrome.runtime.sendMessage({
      type: 'AUTH_TOKEN_FOUND',
      token,
      refreshToken,
    });
  }
}

reportWebsiteAuth();
// OAuth writes localStorage in the same tab, which does not emit a `storage`
// event there. A small frontend-only poll catches that successful callback.
if (isCandorApplyFrontend) setInterval(reportWebsiteAuth, 2000);

// ── Message listener (respond to READ_LOCAL_STORAGE from background) ──────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'READ_LOCAL_STORAGE') {
    const token = localStorage.getItem(CONFIG.AUTH.LOCALSTORAGE_KEY);
    const refreshToken = localStorage.getItem(CONFIG.AUTH.REFRESH_KEY);
    sendResponse({ ok: true, token, refreshToken });
    return false;
  }

  if (request.type === 'ACTIVATE_AUTOFILL') {
    activateAutoFill(request.jobId);
    sendResponse({ success: true });
    return false;
  }

  if (request.type === 'OPEN_ASSISTANT') {
    activateAutoFill(request.jobId).finally(() => openPanel());
    sendResponse({ success: true });
    return false;
  }
});

// ── Auto-activate if job ID is in URL ─────────────────────────────────────────
(function checkUrl() {
  const params = new URLSearchParams(window.location.search);
  const jobId  = params.get(CONFIG.JOB_ID_PARAM);
  if (jobId) activateAutoFill(jobId);
  else if (!CONFIG.FEATURES.TRACKED_JOBS_ONLY) activateAutoFill(null);
})();

// ── Activation ────────────────────────────────────────────────────────────────

async function activateAutoFill(jobId) {
  if (isActivated) {
    showAssistantButton();
    return;
  }
  isActivated   = true;
  currentJobId  = jobId;

  // Render immediately. Profile loading must never prevent the assistant from
  // appearing on slow application pages or after a service-worker restart.
  showAssistantButton();
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_USER_PROFILE' });
    userProfile = res?.profile || null;
  } catch (error) {
    console.warn('[CandorApply] Profile load failed:', error);
    userProfile = null;
  }

  if (CONFIG.FEATURES.DEBUG_MODE) {
    console.log('[CandorApply] Activated. Job:', jobId, '| Profile:', userProfile?.name);
  }
}

// ── Form detection ────────────────────────────────────────────────────────────

let detectedForms = [];

function detectForms() {
  detectedForms = [];

  document.querySelectorAll('form').forEach(form => {
    const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
    if (inputs.length > 0) detectedForms.push({ form, inputs });
  });

  // Standalone inputs (React portals, Greenhouse, Lever, Workday)
  const inForm      = new Set(document.querySelectorAll('form input, form textarea, form select'));
  const standalone  = Array.from(
    document.querySelectorAll('input, textarea, select')
  ).filter(el => !inForm.has(el));
  if (standalone.length > 0) detectedForms.push({ form: null, inputs: standalone });
}

// ── Floating button ───────────────────────────────────────────────────────────

function showAssistantButton() {
  if (document.getElementById('abp-assistant')) return;

  const btn = document.createElement('div');
  btn.id        = 'abp-assistant';
  btn.className = 'applybotpro-floating-btn';
  btn.innerHTML = `
    <div class="applybotpro-btn-content">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span>Review fields</span>
    </div>
  `;
  btn.addEventListener('click', openPanel);
  document.body.appendChild(btn);
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function openPanel() {
  let panel = document.getElementById('abp-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    return;
  }

  const notLoggedIn = !userProfile;

  panel = document.createElement('div');
  panel.id        = 'abp-panel';
  panel.className = 'applybotpro-panel';

  panel.innerHTML = `
    <div class="applybotpro-panel-header">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:28px;height:28px;border-radius:6px;background:#245c46;display:flex;align-items:center;justify-content:center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span style="font-weight:700;font-size:15px">CandorApply</span>
      </div>
      <button id="abp-close" class="applybotpro-close-btn">×</button>
    </div>

    <div class="applybotpro-panel-content">
      ${notLoggedIn ? `
        <div class="applybotpro-status" style="border-left:3px solid #EF4444">
          <p style="color:#DC2626;font-weight:600">⚠ Not connected</p>
          <p style="font-size:12px;color:#666;margin-top:4px">Log in to CandorApply to enable autofill.</p>
          <a href="${CONFIG.FRONTEND_URL}/login" target="_blank"
             style="display:inline-block;margin-top:10px;padding:8px 16px;background:#245c46;color:white;border-radius:6px;font-size:13px;font-weight:650;text-decoration:none">
            Log in →
          </a>
        </div>
      ` : `
        <div class="applybotpro-status">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <div style="width:7px;height:7px;border-radius:50%;background:#3f765f"></div>
            <p style="font-weight:700;font-size:14px;color:#111">${userProfile.name}</p>
          </div>
          <p style="font-size:12px;color:#888">${userProfile.email}</p>
          ${userProfile.job_title ? `<p style="font-size:12px;color:#245c46;margin-top:2px;font-weight:600">${userProfile.job_title}</p>` : ''}
        </div>

        <div class="applybotpro-actions">
          <button id="abp-fill-btn" class="applybotpro-action-btn primary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Scan application
          </button>
          <button id="abp-preview-btn" class="applybotpro-action-btn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>
            Preview Profile
          </button>
          <button id="abp-applied-btn" class="applybotpro-action-btn success">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Mark as Applied
          </button>
        </div>
      `}

      <div id="abp-results" class="applybotpro-results"></div>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById('abp-close').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  if (!notLoggedIn) {
    document.getElementById('abp-fill-btn').addEventListener('click', fillFormWithAI);
    document.getElementById('abp-preview-btn').addEventListener('click', previewData);
    document.getElementById('abp-applied-btn').addEventListener('click', markAsApplied);
  }
}

// ── AI form fill ──────────────────────────────────────────────────────────────

async function fillFormWithAI() {
  const resultsDiv = document.getElementById('abp-results');
  resultsDiv.innerHTML = '<div class="applybotpro-loading">Scanning form fields…</div>';

  detectForms();

  // Collect all fillable fields
  const formFields = [];
  detectedForms.forEach(({ inputs }) => {
    inputs.forEach(input => {
      if (['hidden','submit','button','file','image','reset'].includes(input.type)) return;
      const currentValue = getCurrentFieldValue(input);
      const label = getFieldLabel(input);
      formFields.push({
        element:     input,
        type:        input.type || input.tagName.toLowerCase(),
        name:        input.name  || input.id || '',
        label,
        context:     getFieldContext(input, label),
        placeholder: input.placeholder || '',
        value:       currentValue,
        options:     getSelectOptions(input),
        checked:     ['checkbox', 'radio'].includes(input.type) ? input.checked : undefined,
        multiple:    input.tagName === 'SELECT' ? input.multiple : undefined,
        required:    input.required || false,
      });
    });
  });

  if (formFields.length === 0) {
    resultsDiv.innerHTML = '<div class="applybotpro-error">No fillable fields found. Scroll to the application form and try again.</div>';
    return;
  }

  resultsDiv.innerHTML = `<div class="applybotpro-loading">Matching ${formFields.length} fields with AI…</div>`;

  try {
    // Send field descriptors (no full resume) to backend proxy
    const fieldDescriptors = formFields.map((f, i) => ({
      index:       i,
      type:        f.type,
      name:        f.name,
      label:       f.label,
      context:     f.context,
      placeholder: f.placeholder,
      currentValue: f.value,
      options:     f.options,
      checked:     f.checked,
      multiple:    f.multiple,
      required:    f.required,
    }));

    // Job context from page (helps AI write better cover letters etc.)
    const jobContext = {
      title:       document.querySelector('h1')?.textContent?.trim() || '',
      company:     document.querySelector('[class*="company"], [data-company]')?.textContent?.trim() || '',
      description: getJobDescriptionContext(),
      url:         window.location.href,
    };

    let filledFields;

    // Try backend proxy (keeps API key secure, also cheaper — no full resume sent)
    const aiResult = await chrome.runtime.sendMessage({
      type:       'AUTOFILL_WITH_AI',
      fields:     fieldDescriptors,
      jobContext,
    });

    if (aiResult?.suggestions && !aiResult.error) {
      filledFields = formFields.map((f, i) => {
        const s = aiResult.suggestions.find(s => s.index === i);
        return {
          ...f,
          suggestedValue: s?.suggestedValue ?? null,
          confidence:     s?.confidence || 'low',
          sourceEvidence: s?.sourceEvidence ?? null,
          reason:         s?.reason || '',
          answerMode:     s?.answerMode || null,
        };
      });
    } else {
      // Fallback: rule-based matching (works offline / if backend is down)
      filledFields = simpleFieldMatching(formFields, userProfile);
    }

    // Never write to the employer's form before the applicant reviews the plan.
    // Existing values may have been typed by the applicant or restored by the
    // employer site/browser, so keep them exactly as they are.
    const preservedFields = filledFields.filter(field =>
      hasNonEmptyFieldValue(field.element)
    );
    pendingFields = filledFields.filter(field =>
      !hasNonEmptyFieldValue(field.element) &&
      hasSuggestedValue(field.suggestedValue) &&
      field.confidence !== 'low' &&
      !isSensitiveField(field)
    );
    const needsReview = filledFields.filter(field =>
      !hasNonEmptyFieldValue(field.element) &&
      (
        !hasSuggestedValue(field.suggestedValue) ||
        field.confidence === 'low' ||
        isSensitiveField(field)
      )
    );

    if (pendingFields.length === 0) {
      resultsDiv.innerHTML = `
        <div class="${preservedFields.length ? 'applybotpro-success' : 'applybotpro-error'}">
          ${preservedFields.length
            ? `No empty fields are ready to fill. Kept <strong>${preservedFields.length}</strong> completed field${preservedFields.length === 1 ? '' : 's'} unchanged.`
            : 'Couldn\'t confidently match any empty fields.'}
          ${needsReview.length
            ? `<p class="applybotpro-tip">${needsReview.length} sensitive or uncertain field${needsReview.length === 1 ? ' needs' : 's need'} your answer.</p>`
            : ''}
        </div>`;
    } else {
      resultsDiv.innerHTML = `
        <div class="applybotpro-review-summary">
          <div><strong>${pendingFields.length}</strong><span>ready</span></div>
          <div><strong>${needsReview.length}</strong><span>need you</span></div>
        </div>
        <div class="applybotpro-review-list">
          ${pendingFields.slice(0, 8).map(field => `
            <div class="applybotpro-review-row">
              <span class="applybotpro-review-check">✓</span>
              <div><small>${escapeHtml(field.label || field.name || 'Application field')}</small>
              <strong>${escapeHtml(String(field.suggestedValue))}</strong>
              <span style="display:block;color:#66736d;font-size:10px;line-height:1.35;margin-top:3px">
                ${escapeHtml(getSuggestionExplanation(field))}
              </span></div>
              <em>${field.confidence || 'medium'}</em>
            </div>`).join('')}
          ${needsReview.length ? `<p class="applybotpro-manual-note">${needsReview.length} sensitive or uncertain field${needsReview.length === 1 ? '' : 's'} will be left untouched.</p>` : ''}
          ${preservedFields.length ? `<p class="applybotpro-manual-note" style="background:#edf4f0;color:#426454">${preservedFields.length} field${preservedFields.length === 1 ? '' : 's'} already completed will be kept unchanged.</p>` : ''}
        </div>
        <button id="abp-confirm-fill" class="applybotpro-action-btn primary">Fill ${pendingFields.length} reviewed field${pendingFields.length === 1 ? '' : 's'}</button>
        <p class="applybotpro-privacy-note">CandorApply never submits the application.</p>
      `;
      document.getElementById('abp-confirm-fill').addEventListener('click', applyReviewedFields);
    }
  } catch (err) {
    console.error('[AutoFill]', err);
    resultsDiv.innerHTML = `<div class="applybotpro-error">Error: ${err.message}</div>`;
  }
}

function isSensitiveField(field) {
  const key = `${field.label || ''} ${field.name || ''} ${field.placeholder || ''}`.toLowerCase();
  return /(gender|sex|race|ethnic|disab|veteran|sponsor|visa|citizen|work authori|salary|compensation|criminal|felony|demographic|pronoun)/.test(key);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char]);
}

function applyReviewedFields() {
  // The applicant can continue typing while the review panel is open. Re-check
  // at confirmation time so a late user edit is never overwritten.
  const fieldsToFill = pendingFields.filter(field =>
    field.element?.isConnected && !hasNonEmptyFieldValue(field.element)
  );
  const skippedCount = pendingFields.length - fieldsToFill.length;
  fieldsToFill.forEach(field => fillField(field.element, field.suggestedValue));
  const resultsDiv = document.getElementById('abp-results');
  resultsDiv.innerHTML = `
    <div class="applybotpro-success">
      Filled <strong>${fieldsToFill.length}</strong> reviewed field${fieldsToFill.length === 1 ? '' : 's'}.
      ${skippedCount ? `<p class="applybotpro-tip">Kept ${skippedCount} field${skippedCount === 1 ? '' : 's'} you completed after the scan unchanged.</p>` : ''}
      <p class="applybotpro-tip">Check the form and answer the remaining questions yourself.</p>
    </div>`;
  pendingFields = [];
}

function hasSuggestedValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function getCurrentFieldValue(element) {
  if (element.tagName === 'SELECT' && element.multiple) {
    return Array.from(element.selectedOptions)
      .filter(option => !option.disabled && !/^(select|choose|please select)/i.test(option.textContent?.trim() || ''))
      .map(option => option.value)
      .filter(value => String(value).trim());
  }
  if (element.tagName === 'SELECT') {
    const option = element.selectedOptions?.[0];
    if (
      !option ||
      option.disabled ||
      !String(option.value || '').trim() ||
      /^(select|choose|please select)/i.test(option.textContent?.trim() || '')
    ) {
      return '';
    }
    return option.value;
  }
  if (['checkbox', 'radio'].includes(element.type)) {
    return element.checked ? (element.value || true) : '';
  }
  return element.value || '';
}

function getSelectOptions(element) {
  if (element.tagName !== 'SELECT') return [];
  return Array.from(element.options).map(option => ({
    value:    option.value,
    label:    option.textContent?.trim() || option.label || option.value,
    selected: option.selected,
    disabled: option.disabled,
  }));
}

function getFieldContext(element, label) {
  const describedBy = (element.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .map(id => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ');
  if (describedBy) return truncateText(describedBy.replace(/\s+/g, ' '), 500);

  const normalizedLabel = String(label || '').replace(/\s+/g, ' ').trim();
  let container = element.parentElement;
  let depth = 0;

  while (container && container !== document.body && depth < 6) {
    if (container.tagName === 'FORM') break;
    const text = getReadableContainerText(container, {
      removeFormControls: true,
      maxLength: 800,
    });
    const isOnlyKnownLabel = normalizedLabel
      && text.toLowerCase() === normalizedLabel.toLowerCase();

    // Avoid sending an entire form section. A nearby, bounded container is
    // useful for custom controls whose actual question is not a <label>.
    if (text && !isOnlyKnownLabel && text.length <= 700) {
      return truncateText(text, 500);
    }

    container = container.parentElement;
    depth += 1;
  }

  return '';
}

function hasNonEmptyFieldValue(element) {
  if (!element) return false;
  const value = getCurrentFieldValue(element);
  return Array.isArray(value)
    ? value.length > 0
    : value !== false && String(value).trim().length > 0;
}

function getSuggestionExplanation(field) {
  const modeLabels = {
    profile: 'Saved profile',
    resume: 'Resume',
    deterministic: 'Saved profile',
    rule: 'Saved profile',
    ai: 'AI answer',
    generated: 'AI answer',
    ai_generated: 'AI answer',
  };
  const mode = modeLabels[String(field.answerMode || '').toLowerCase()]
    || cleanMetadata(field.answerMode);
  const reason = cleanMetadata(field.reason);
  const evidence = cleanMetadata(field.sourceEvidence);
  const parts = [];

  if (mode) parts.push(mode);
  if (reason) parts.push(reason);
  if (evidence && !reason.toLowerCase().includes(evidence.toLowerCase())) {
    parts.push(`Evidence: ${evidence}`);
  }

  return truncateText(parts.join(' · ') || 'Matched from your saved profile', 180);
}

function cleanMetadata(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(cleanMetadata).filter(Boolean).join('; ');
  }
  if (typeof value === 'object') {
    const preferredValue = value.text || value.quote || value.value
      || value.source || value.field || value.label;
    if (preferredValue) return cleanMetadata(preferredValue);
    try {
      return JSON.stringify(value);
    } catch (_) {
      return '';
    }
  }
  return String(value).replace(/\s+/g, ' ').trim();
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function getJobDescriptionContext() {
  const selectors = [
    '[data-testid*="job-description" i]',
    '[id*="job-description" i]',
    '[class*="job-description" i]',
    '[id*="jobdescription" i]',
    '[class*="jobdescription" i]',
    '[data-testid*="description" i]',
    'article',
    'main',
    '[role="main"]',
  ];
  const seen = new Set();
  let best = { text: '', score: -1 };

  selectors.forEach((selector, selectorIndex) => {
    let matches = [];
    try {
      matches = Array.from(document.querySelectorAll(selector));
    } catch (_) {
      return;
    }

    matches.forEach(element => {
      if (seen.has(element) || element.closest('#abp-panel')) return;
      seen.add(element);
      const text = getReadableContainerText(element, {
        removeForms: true,
        maxLength: 7000,
      });
      if (text.length < 120) return;

      const keywordHits = (
        text.match(/\b(responsibilit|qualification|requirement|experience|about (us|the role)|who you are|job description)\w*/gi)
        || []
      ).length;
      const selectorPriority = (selectors.length - selectorIndex) * 500;
      const score = selectorPriority + Math.min(text.length, 6000) + (keywordHits * 120);
      if (score > best.score) best = { text, score };
    });
  });

  return truncateText(best.text, 6000);
}

function getReadableContainerText(element, options = {}) {
  const clone = element.cloneNode(true);
  const removals = [
    '#abp-panel',
    '#abp-assistant',
    'script',
    'style',
    'noscript',
    'template',
    'svg',
  ];
  if (options.removeForms) {
    removals.push('form', 'nav', 'aside', 'footer');
  } else if (options.removeFormControls) {
    removals.push('input', 'textarea', 'select', 'button');
  }
  clone.querySelectorAll(removals.join(',')).forEach(node => node.remove());
  clone.querySelectorAll('p,li,br,h1,h2,h3,h4,h5,h6,dt,dd,section,div')
    .forEach(node => node.append(' '));

  const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
  return truncateText(text, options.maxLength || 1000);
}

// ── Rule-based fallback matching ──────────────────────────────────────────────

function simpleFieldMatching(formFields, profile) {
  const [firstName, ...rest] = (profile.name || '').split(' ');
  const lastName    = rest.join(' ');
  const skillsStr   = Array.isArray(profile.skills) ? profile.skills.join(', ') : '';
  const summary     = profile.summary || (profile.resume_text || '').substring(0, 500);

  formFields.forEach(field => {
    const key = `${field.label} ${field.name} ${field.placeholder}`
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    if      (/\b(e mail|email)( address)?\b/.test(key))      field.suggestedValue = profile.email;
    else if (/\b(phone|mobile|telephone)( number)?\b/.test(key)) field.suggestedValue = profile.phone;
    else if (/\bfirst name\b/.test(key))                     field.suggestedValue = firstName;
    else if (/\b(last name|surname)\b/.test(key))            field.suggestedValue = lastName;
    else if (/\bfull name\b/.test(key))                      field.suggestedValue = profile.name;
    else if (/^(applicant |candidate |legal |preferred )?name( value)?$/.test(key)) field.suggestedValue = profile.name;
    else if (/city/.test(key))                               field.suggestedValue = profile.city;
    else if (/address/.test(key))                            field.suggestedValue = profile.address;
    else if (/state|province/.test(key))                     field.suggestedValue = profile.state;
    else if (/zip|postal/.test(key))                         field.suggestedValue = profile.zip;
    else if (/country/.test(key))                            field.suggestedValue = profile.country;
    else if (/linkedin/.test(key))                           field.suggestedValue = profile.linkedin_url;
    else if (/github/.test(key))                             field.suggestedValue = profile.github_url;
    else if (/\b(portfolio|personal website)\b/.test(key))   field.suggestedValue = profile.portfolio_url;
    else if (/\bskills?\b/.test(key))                        field.suggestedValue = skillsStr;
    else if (/\b(professional summary|cover letter|about me|biography|bio)\b/.test(key)) field.suggestedValue = summary;
    else if (/\b(current|most recent|desired) (job )?(title|position|role)\b/.test(key)) field.suggestedValue = profile.job_title;
  });

  return formFields;
}

// ── Field fill (React/Vue compatible) ─────────────────────────────────────────

function fillField(element, value) {
  if (!value) return;

  if (element.tagName === 'SELECT') {
    const match = Array.from(element.options).find(
      o => o.value.toLowerCase() === value.toLowerCase() ||
           o.text.toLowerCase()  === value.toLowerCase()
    );
    if (match) element.value = match.value;
  } else if (element.type === 'checkbox') {
    element.checked = Boolean(value);
  } else if (element.type === 'radio') {
    if (element.value === value) element.checked = true;
  } else {
    // Use native setter to bypass React's synthetic event system
    const proto  = element.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(element, value);
    else element.value = value;

    element.dispatchEvent(new Event('input',  { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur',   { bubbles: true }));
  }

  // Green flash feedback
  const orig = element.style.backgroundColor;
  element.style.transition  = 'background-color 0.3s ease';
  element.style.backgroundColor = 'rgba(99,102,241,0.12)';
  setTimeout(() => { element.style.backgroundColor = orig; }, 1800);
}

// ── Get label for a field ─────────────────────────────────────────────────────

function getFieldLabel(input) {
  if (input.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (lbl) return lbl.textContent.trim();
  }
  const parentLbl = input.closest('label');
  if (parentLbl) return parentLbl.textContent.replace(input.value, '').trim();

  for (const attr of ['aria-label', 'aria-labelledby', 'title']) {
    const v = input.getAttribute(attr);
    if (!v) continue;
    if (attr === 'aria-labelledby') {
      const el = document.getElementById(v);
      if (el) return el.textContent.trim();
    } else {
      return v.trim();
    }
  }

  const prev = input.previousElementSibling;
  if (prev && ['LABEL','SPAN','P','DIV'].includes(prev.tagName)) {
    return prev.textContent.trim();
  }
  return '';
}

// ── Preview profile data ──────────────────────────────────────────────────────

function previewData() {
  const resultsDiv = document.getElementById('abp-results');
  if (!userProfile) {
    resultsDiv.innerHTML = '<div class="applybotpro-error">No profile loaded. Please log in.</div>';
    return;
  }

  const skills = Array.isArray(userProfile.skills)
    ? userProfile.skills.slice(0, 8).join(', ')
    : '—';

  const rows = [
    ['Name',      userProfile.name         || '—'],
    ['Email',     userProfile.email        || '—'],
    ['Phone',     userProfile.phone        || '—'],
    ['City',      userProfile.city         || '—'],
    ['Title',     userProfile.job_title    || '—'],
    ['LinkedIn',  userProfile.linkedin_url || '—'],
    ['GitHub',    userProfile.github_url   || '—'],
    ['Portfolio', userProfile.portfolio_url|| '—'],
    ['Skills',    skills],
    ['Experience', `${userProfile.experience?.length || 0} role(s)`],
    ['Education', `${userProfile.education?.length || 0} entr${userProfile.education?.length === 1 ? 'y' : 'ies'}`],
    ['Certificates', `${userProfile.certifications?.length || 0}`],
    ['Projects', `${userProfile.projects?.length || 0}`],
    ['Languages', `${userProfile.languages?.length || 0}`],
  ];

  resultsDiv.innerHTML = `
    <div class="applybotpro-preview">
      <h4>Profile loaded ✓</h4>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        ${rows.map(([label, val]) => `
          <tr>
            <td style="padding:5px 10px 5px 0;color:#888;white-space:nowrap;font-weight:600">${label}</td>
            <td style="padding:5px 0;color:#111;word-break:break-all">${val}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
}

// ── Mark as applied ───────────────────────────────────────────────────────────

async function markAsApplied() {
  const resultsDiv = document.getElementById('abp-results');
  resultsDiv.innerHTML = '<div class="applybotpro-loading">Saving application…</div>';

  try {
    const jobTitle = document.querySelector('h1')?.textContent?.trim() || 'Unknown Position';
    const company  =
      document.querySelector('[class*="company"], [data-company], [class*="employer"]')
        ?.textContent?.trim() || 'Unknown Company';

    const applicationData = {
      job_id:          currentJobId,
      job_title:       jobTitle,
      company:         company,
      source_url:      window.location.href,
      source_platform: window.location.hostname,
      applied_at:      new Date().toISOString(),
      status:          'applied',
      tracked_by_extension: true,
      source:          'extension',
    };

    const res = await chrome.runtime.sendMessage({
      type: 'MARK_APPLIED',
      applicationData,
    });

    if (res?.success) {
      resultsDiv.innerHTML = `
        <div class="applybotpro-success">
          ✓ Application saved!
          <p class="applybotpro-tip">Track it in your Applications tab on CandorApply.</p>
        </div>
      `;
    } else {
      resultsDiv.innerHTML = '<div class="applybotpro-error">Could not save. Check your connection.</div>';
    }
  } catch (e) {
    resultsDiv.innerHTML = `<div class="applybotpro-error">Error: ${e.message}</div>`;
  }
}

if (CONFIG.FEATURES.DEBUG_MODE) console.log('[CandorApply] Content script ready');
