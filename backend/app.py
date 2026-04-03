"""
ApplyBot Pro - Flask Backend
Main application entry point
"""

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from config import get_config
from database import init_db, get_supabase

from routes.analyze import analyze_bp
from routes.applications import applications_bp
from routes.jobs import jobs_bp
from routes.apply import apply_bp
from routes.interview import interview_bp
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.resumes import resumes_bp
from routes.briefing import apply_briefing_bp
from routes.cv import cv_bp
from routes.subscription import subscription_bp
from oauth_routes import oauth_bp, oauth 
from routes.extension_route import extension_bp

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)

    config = get_config()
    app.config.from_object(config)

    # CORS — allow your Netlify frontend + localhost for dev
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "https://applybotpro.netlify.app",
        "https://job-matcher-rasg.onrender.com"
    ]

    frontend_url = os.getenv("FRONTEND_URL", "")
    if frontend_url and frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)

    CORS(app, origins=allowed_origins, supports_credentials=True)

    # Required for Authlib OAuth state cookie
    app.secret_key = os.getenv("FLASK_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "change-me"))

    # Initialize Supabase
    try:
        init_db(app)
        print("✅ Supabase initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase: {e}")
        raise

    # Initialize OAuth (Authlib needs this)
    oauth.init_app(app)   # ← ADD THIS

    # Register blueprints
    app.register_blueprint(auth_bp,             url_prefix="/api/auth")
    app.register_blueprint(oauth_bp,            url_prefix="/api")        # ← ADD THIS
    app.register_blueprint(profile_bp,          url_prefix="/api")
    app.register_blueprint(resumes_bp,          url_prefix="/api")
    app.register_blueprint(analyze_bp,          url_prefix="/api")
    app.register_blueprint(applications_bp,     url_prefix="/api")
    app.register_blueprint(jobs_bp,             url_prefix="/api")
    app.register_blueprint(apply_bp,            url_prefix="/api")
    app.register_blueprint(interview_bp,        url_prefix="/api")
    app.register_blueprint(apply_briefing_bp,   url_prefix="/api")
    app.register_blueprint(cv_bp,               url_prefix="/api")
    app.register_blueprint(subscription_bp,     url_prefix="/api")
    app.register_blueprint(extension_bp, url_prefix="/api")


@app.route("/api/health")
def health_check():
    try:
        supabase = get_supabase()
        supabase.table("users").select("count", count="exact").limit(0).execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({
        "status":        "healthy",
        "service":       "ApplyBot Pro API",
        "database":      db_status,
        "database_type": "Supabase (PostgreSQL)",
    })

@app.route("/")
def index():
    return jsonify({
        "message":  "ApplyBot Pro API",
        "version":  "2.0.0",
        "database": "Supabase",
        "status":   "running",
    })

    return app


if __name__ == "__main__":
    app = create_app()
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
