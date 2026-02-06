"""
ApplyBot Pro - Flask Backend
Main application entry point
"""

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import config and database
from config import get_config
from database import init_db

# Import routes
from routes.analyze import analyze_bp
from routes.applications import applications_bp
from routes.jobs import jobs_bp
from routes.apply import apply_bp
from routes.interview import interview_bp
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.resumes import resumes_bp
from routes.briefing import apply_briefing_bp


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Enable CORS for frontend communication
    CORS(app, origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000"
    ], supports_credentials=True)
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")  # FIXED: Added /auth to prefix
    app.register_blueprint(profile_bp, url_prefix="/api")
    app.register_blueprint(resumes_bp, url_prefix="/api")
    app.register_blueprint(analyze_bp, url_prefix="/api")
    app.register_blueprint(applications_bp, url_prefix="/api")
    app.register_blueprint(jobs_bp, url_prefix="/api")
    app.register_blueprint(apply_bp, url_prefix="/api")
    app.register_blueprint(interview_bp, url_prefix="/api")
    app.register_blueprint(apply_briefing_bp, url_prefix="/api")
    
    @app.route("/api/health")
    def health_check():
        """Health check endpoint."""
        from database import db
        try:
            # Test database connection
            db.session.execute(db.text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        return {
            "status": "healthy",
            "service": "ApplyBot Pro API",
            "database": db_status
        }
    
    return app


if __name__ == "__main__":
    app = create_app()
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
