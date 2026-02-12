"""
ApplyBot Pro - Flask Backend
Main application entry point - UPDATED FOR SUPABASE
"""

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import config and database
from config import get_config
from database import init_db, get_supabase

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
    
    # Initialize Supabase
    try:
        init_db(app)
        print("✅ Supabase initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase: {e}")
        raise
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
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
        try:
            # Test Supabase connection
            supabase = get_supabase()
            # Simple query to verify connection
            result = supabase.table('users').select('count', count='exact').limit(0).execute()
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        return jsonify({
            "status": "healthy",
            "service": "ApplyBot Pro API",
            "database": db_status,
            "database_type": "Supabase (PostgreSQL)"
        })
    
    @app.route("/")
    def index():
        """Root endpoint."""
        return jsonify({
            "message": "ApplyBot Pro API",
            "version": "2.0.0",
            "database": "Supabase",
            "status": "running"
        })
    
    return app


if __name__ == "__main__":
    app = create_app()
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
