# CandorApply

**Review first. Apply with confidence.** CandorApply helps candidates find
better-fit roles, tailor truthful application materials, safely autofill forms,
track applications, and prepare for interviews.

![CandorApply](https://img.shields.io/badge/CandorApply-review--first-1f2937?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)
![Flask](https://img.shields.io/badge/Flask-2.3.3-000000?style=flat-square&logo=flask)
![OpenRouter](https://img.shields.io/badge/OpenRouter-free-6467f2?style=flat-square)

---

## ✨ Features

### 1. 📊 Analyze Your Fit
Upload your CV and paste a job description to get an AI-powered compatibility analysis. See how well your skills match the role with detailed scoring and recommendations.

### 2. 🔍 Search Jobs
Find opportunities with our integrated job scraper. Filter by location, job type, and experience level to discover your perfect match.

### 3. 📋 Track Applications
Kanban-style board to manage your job applications. Track status from applied → interviewing → offer → accepted.

### 4. ✍️ AI-Powered Apply
Generate truthful drafts tailored to each job description through the
configured OpenRouter model.

### 5. 🎯 Interview Prep
Get AI-generated interview questions and preparation materials based on the specific role and company.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Modern UI with hooks and functional components
- **TypeScript** — Type-safe development
- **Vite** — Lightning-fast build tool
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Beautiful, accessible components
- **React Router** — Client-side routing
- **TanStack Query** — Server state management
- **Framer Motion** — Smooth animations
- **Lottie React** — Vector animations

### Backend
- **Flask 2.3.3** — Python web framework
- **Flask-CORS 4.0.0** — Cross-origin resource sharing
- **OpenRouter HTTP API** — AI-powered analysis and generation
- **Requests 2.31.0** — HTTP library for job scraping
- **BeautifulSoup4 4.12.2** — Web scraping and parsing
- **PyPDF2 3.0.1** — PDF resume parsing
- **python-docx 1.1.0** — Word document parsing
- **python-dotenv 1.0.0** — Environment variable management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+
- OpenRouter API key

### Frontend Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd candorapply

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

# Run the Flask server
flask run
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=http://localhost:5173
FLASK_ENV=development
FLASK_DEBUG=1
```

---

## 📁 Project Structure

```
candorapply/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable UI components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route pages
│   ├── types/            # TypeScript definitions
│   └── lib/              # Utility functions
├── backend/
│   ├── app.py            # Flask application
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   │   ├── ai.py         # OpenRouter integration
│   │   ├── parser.py     # CV/resume parsing
│   │   └── scraper.py    # Job scraping
│   └── requirements.txt  # Python dependencies
└── public/               # Static assets
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyze CV against job description |
| GET | `/api/applications` | Get all tracked applications |
| POST | `/api/interview-prep` | Generate interview prep materials |
| GET | `/api/jobs/search` | Search for job listings |
| POST | `/api/apply/prepare` | Generate cover letter & email |

---

## 🎨 Screenshots

> *Coming soon*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Joy Njoroge**

- LinkedIn: [@joynjorogesaas](https://www.linkedin.com/in/joynjorogesaas/)
- GitHub: [@JoyNjoroge](https://github.com/JoyNjoroge)

---

<p align="center">
  Made with ❤️ by Joy Njoroge
</p>

---

## Production release checklist

The repository includes Netlify and Render configuration plus CI release checks.
Before deploying:

1. Copy `.env.example` values into Netlify and `backend/.env.example` values
   into Render. Never add either real environment file to Git.
2. Set `VITE_API_URL` to the public API URL including `/api`.
3. Use independent random values for `SECRET_KEY`, `JWT_SECRET_KEY`, and
   `FLASK_SECRET_KEY`.
4. Configure `SUPABASE_SERVICE_ROLE_KEY` on Render. Never expose that value in
   the frontend or extension.
5. Create the Supabase tables used by the API: `users`, `user_profiles`,
   `user_roles`, `resumes`, `job_applications`, `subscriptions`,
   `usage_tracking`, `cover_letters`, and `ai_response_cache`.
6. Configure Google and LinkedIn callback URLs as
   `${OAUTH_REDIRECT_BASE}/auth/{provider}/callback`.
7. Configure the Paystack webhook as
   `https://YOUR_API/api/subscription/webhook` and ensure both plan codes use
   the same currency and prices shown in the UI.
8. Set `FRONTEND_URL` without a trailing slash and deploy the backend before
   the frontend.
9. Confirm `/api/health` returns HTTP 200. A database failure intentionally
   returns HTTP 503.
10. Upload the versioned extension archives from
    `candorapply-extension/candorapply-extension/`. Their manifests are at the
    root of each archive, as required by browser stores.

Run the same checks as CI:

```bash
npm ci
npm run lint
npm test
npm run build
python -m compileall -q backend
```
