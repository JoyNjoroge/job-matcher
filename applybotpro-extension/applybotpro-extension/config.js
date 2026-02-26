// ========================================
// APPLYBOTPRO EXTENSION CONFIGURATION
// ========================================
// UPDATE THESE VALUES WITH YOUR ACTUAL SETTINGS

const CONFIG = {
  // ============ WEBSITE CONFIGURATION ============
  // Replace with your actual ApplyBotPro domain
  APPLYBOTPRO_DOMAIN: 'https://applybotpro.netlify.app',
  
  // ============ API ENDPOINTS ============
  // Replace these with your actual API endpoints
  API_ENDPOINTS: {
    // Endpoint to get user profile/resume data
    // Expected response: { success: true, data: { name, email, phone, resume_text, skills, experience, etc. } }
    GET_PROFILE: '/api/user/profile',
    
    // Endpoint to track job application
    // POST body: { job_id, job_title, company, application_url, status: 'applied' }
    // Expected response: { success: true, application_id: '...' }
    TRACK_APPLICATION: '/api/applications/track',
    
    // Endpoint to get tracked job details (when coming from applybotpro)
    // Query params: ?job_id=xxx
    // Expected response: { success: true, job: { id, title, company, description, etc. } }
    GET_JOB_DETAILS: '/api/jobs/details'
  },
  
  // ============ AUTHENTICATION ============
  // How the extension will get the auth token from your website
  AUTH: {
    // Cookie name where auth token is stored (if using cookies)
    COOKIE_NAME: 'applybotpro_token',
    
    // LocalStorage key where auth token is stored (if using localStorage)
    LOCALSTORAGE_KEY: 'applybotpro_auth_token',
    
    // Or you can use both - extension will check both locations
  },
  
  // ============ GEMINI AI CONFIGURATION ============
  // IMPORTANT: Add your Gemini API key here
  GEMINI_API_KEY: 'AIzaSyBdqppoKimzlYs0blN9CeGQjmnLgjudPJk', // ⚠️ REPLACE THIS
  GEMINI_MODEL: 'gemini-2.5-flash', // or whatever model you're using
  
  // ============ JOB TRACKING ============
  // URL parameter used when redirecting from applybotpro
  // Example: https://linkedin.com/jobs/123?applybotpro_job_id=abc123
  JOB_ID_PARAM: 'applybotpro_job_id',
  
  // ============ FEATURE FLAGS ============
  FEATURES: {
    // Only activate on jobs that came from applybotpro?
    TRACKED_JOBS_ONLY: true, // Set to false to work on any job application form
    
    // Auto-detect forms even without clicking Apply button on applybotpro?
    AUTO_DETECT_FORMS: false, // Recommended: false for better UX
    
    // Show debug logs in console?
    DEBUG_MODE: true // Set to false in production
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
