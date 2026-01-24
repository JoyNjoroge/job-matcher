# 🚀 ApplyBot Pro

**Job Applications Made Easy** — An AI-powered job application assistant that helps you analyze job fits, search opportunities, track applications, and generate personalized cover letters.

![ApplyBot Pro](https://img.shields.io/badge/ApplyBot-Pro-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)
![Flask](https://img.shields.io/badge/Flask-2.3.3-000000?style=flat-square&logo=flask)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285f4?style=flat-square&logo=google)

---

## ✨ Features

### 1. 📊 Analyze Your Fit
Upload your CV and paste a job description to get an AI-powered compatibility analysis. See how well your skills match the role with detailed scoring and recommendations.

### 2. 🔍 Search Jobs
Find opportunities with our integrated job scraper. Filter by location, job type, and experience level to discover your perfect match.

### 3. 📋 Track Applications
Kanban-style board to manage your job applications. Track status from applied → interviewing → offer → accepted.

### 4. ✍️ AI-Powered Apply
Generate personalized cover letters and emails tailored to each job description using Gemini AI.

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
- **Google Generative AI (Gemini) 0.3.2** — AI-powered analysis and generation
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
- Google Gemini API key

### Frontend Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd applybot-pro

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
# Add your GEMINI_API_KEY to .env

# Run the Flask server
flask run
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FLASK_ENV=development
FLASK_DEBUG=1
```

---

## 📁 Project Structure

```
applybot-pro/
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
│   │   ├── gemini.py     # Gemini AI integration
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
