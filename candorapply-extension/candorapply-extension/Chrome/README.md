# CandorApply Browser Extension

Smart job application assistant that auto-fills forms using AI.

## 🚀 Features

- **Auto-Fill Job Applications**: Uses configured AI provider to intelligently fill out job application forms
- **Profile Sync**: Automatically syncs with user's CandorApply account
- **Job Tracking**: Tracks applications and syncs back to CandorApply
- **Multi-Site Support**: Works on LinkedIn, Indeed, company websites, and more
- **Chrome & Firefox Support**: Works on both major browsers

## 📋 Setup Instructions

### 1. Configure Your Settings

Edit `config.js` and update the following:

```javascript
// Your CandorApply domain
APPLYBOTPRO_DOMAIN: 'https://your-actual-domain.com',

// Your API endpoints
API_ENDPOINTS: {
  GET_PROFILE: '/api/user/profile',
  TRACK_APPLICATION: '/api/applications/track',
  GET_JOB_DETAILS: '/api/jobs/details'
},

// Your authentication method
AUTH: {
  COOKIE_NAME: 'your_auth_cookie_name',
  LOCALSTORAGE_KEY: 'your_auth_key',
},

// Your AI provider API key
OPENROUTER_API_KEY: 'your-gemini-api-key-here',
```

### 2. Add Extension Icons

Create icons in the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create these using any image editor or generate them online.

### 3. Install in Chrome (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `candorapply-extension` folder
5. The extension is now installed!

### 4. Install in Firefox (Development)

1. Rename `manifest-firefox.json` to `manifest.json` (replace the Chrome version)
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file
6. The extension is now installed!

## 🔗 Website Integration

### 1. Add Extension Install Flow

On your CandorApply website, add a button/section for users to install the extension:

```html
<div class="extension-install">
  <h3>Install Browser Extension</h3>
  <p>Get smart auto-fill assistance on job applications</p>
  
  <a href="https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID" 
     class="btn chrome">
    Install for Chrome
  </a>
  
  <a href="https://addons.mozilla.org/firefox/addon/YOUR_EXTENSION_ID" 
     class="btn firefox">
    Install for Firefox
  </a>
</div>
```

### 2. Pass Job ID When Redirecting

When a user clicks "Apply" on your website, redirect them with the tracking parameter:

```javascript
function redirectToJobApplication(job) {
  const jobUrl = job.application_url;
  const trackingUrl = `${jobUrl}${jobUrl.includes('?') ? '&' : '?'}applybotpro_job_id=${job.id}`;
  
  window.open(trackingUrl, '_blank');
}
```

### 3. Backend API Endpoints

Create these API endpoints that the extension will call:

#### GET /api/user/profile
Returns user's resume/profile data:
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "San Francisco",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "portfolio_url": "https://johndoe.com",
    "resume_text": "Full resume text here...",
    "skills": ["JavaScript", "Python", "React"],
    "experience": [...]
  }
}
```

#### POST /api/applications/track
Receives application data when user marks job as applied:
```json
{
  "job_id": "abc123",
  "job_title": "Software Engineer",
  "company": "Tech Corp",
  "application_url": "https://techcorp.com/apply/123",
  "applied_at": "2024-02-04T12:00:00Z",
  "status": "applied"
}
```

Response:
```json
{
  "success": true,
  "application_id": "app_xyz789"
}
```

## 🔒 Security Notes

### API Key Security
**IMPORTANT**: Never commit your AI provider API key to version control!

For production:
1. Store the API key in environment variables
2. Make API calls from your backend instead of the extension
3. Have the extension call your backend, which then calls AI provider

Example backend proxy:
```javascript
// On your server
app.post('/api/extension/fill-form', async (req, res) => {
  const { fields, userProfile } = req.body;
  
  // Call AI provider API from server (API key is secure)
  const suggestions = await callAI providerAPI(fields, userProfile);
  
  res.json({ suggestions });
});
```

Then update `content.js` to call your backend instead of AI provider directly.

### Authentication
- Use HTTPS for all API calls
- Implement token expiration and refresh
- Validate tokens on every API request
- Consider using OAuth 2.0 for better security

## 📦 Publishing to Stores

### Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 registration fee
3. Create a ZIP of your extension folder
4. Upload and fill in store listing details
5. Submit for review (usually takes 1-3 days)

### Firefox Add-ons

1. Create an account at https://addons.mozilla.org/developers/
2. For Firefox, you need to use `manifest-firefox.json`
3. Create a ZIP of your extension
4. Upload and fill in listing details
5. Submit for review

## 🧪 Testing

### Test Authentication
1. Log in to CandorApply
2. Check if extension popup shows "Connected"
3. Verify user name appears in popup

### Test Auto-Fill
1. Click "Apply" on a job in CandorApply
2. On application page, click the floating button
3. Click "Smart Fill Form"
4. Verify fields are filled correctly

### Test Job Tracking
1. Fill application and click "Mark as Applied"
2. Check if job appears in Applications table on CandorApply

## 🐛 Troubleshooting

### Extension not detecting auth token
- Check that cookie/localStorage names in `config.js` match your website
- Verify CORS settings allow extension to read cookies
- Check browser console for errors

### Auto-fill not working
- Verify AI provider API key is correct
- Check network tab for API errors
- Enable DEBUG_MODE in config.js to see detailed logs

### Fields not filling correctly
- The AI needs good field labels/names to work well
- You may need to improve the prompt in `matchFieldsWithAI()`
- Consider adding custom logic for specific sites

## 📄 File Structure

```
candorapply-extension/
├── manifest.json           # Chrome extension manifest
├── manifest-firefox.json   # Firefox extension manifest
├── config.js              # Configuration (API keys, endpoints)
├── background.js          # Background service worker
├── content.js            # Content script (runs on pages)
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── styles.css            # Extension UI styles
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🤝 Support

For issues or questions:
1. Check the browser console for error messages
2. Enable DEBUG_MODE in config.js for detailed logs
3. Contact CandorApply support

## 📝 License

[Your License Here]
