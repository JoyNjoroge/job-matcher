"""
CandorApply - Flask Backend
Main application entry point
"""

from flask import Flask, jsonify, request
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
    app.config["MAX_CONTENT_LENGTH"] = int(
        os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))
    )

    # CORS — allow your Netlify frontend + localhost for dev
    is_production = os.getenv("FLASK_ENV") == "production"
    allowed_origins = ["https://applybotpro.netlify.app"]
    if not is_production:
        allowed_origins.extend([
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:3000",
        ])

    frontend_url = os.getenv("FRONTEND_URL", "")
    if frontend_url and frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)

    CORS(app, origins=allowed_origins, supports_credentials=True)

    # Required for Authlib OAuth state cookie
    app.secret_key = os.getenv(
        "FLASK_SECRET_KEY",
        app.config["SECRET_KEY"],
    )

    # Initialize Supabase
    try:
        init_db(app)
        print("✅ Supabase initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase: {e}")
        raise

    # Initialize OAuth (Authlib needs this)
    oauth.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp,             url_prefix="/api/auth")
    app.register_blueprint(oauth_bp,            url_prefix="/api")       
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
    app.register_blueprint(extension_bp,        url_prefix="/api")

    @app.route("/api/health")
    def health_check():
        try:
            supabase = get_supabase()
            supabase.table("users").select("count", count="exact").limit(0).execute()
            db_status = "connected"
        except Exception:
            return jsonify({
                "status": "unhealthy",
                "service": "CandorApply API",
                "database": "unavailable",
            }), 503

        return jsonify({
            "status":        "healthy",
            "service":       "CandorApply API",
            "database":      db_status,
            "database_type": "Supabase (PostgreSQL)",
        })

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()",
        )
        response.headers.setdefault("Cache-Control", "no-store")
        if request.is_secure:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )
        return response

    @app.errorhandler(413)
    def file_too_large(_error):
        return jsonify({"error": "Upload exceeds the 10 MB limit"}), 413

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(_error):
        return jsonify({"error": "Internal server error"}), 500

    @app.route("/")
    def index():
        return jsonify({
            "message":  "CandorApply API",
            "version":  "2.0.0",
            "database": "Supabase",
            "status":   "running",
        })

    return app


if __name__ == "__main__":
    app = create_app()
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
