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

# Import routes
from routes.analyze import analyze_bp
from routes.applications import applications_bp
from routes.jobs import jobs_bp
from routes.apply import apply_bp
from routes.interview import interview_bp

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Enable CORS for frontend communication
    CORS(app, origins=["http://localhost:5173", "http://localhost:8080"])
    
    # Register blueprints
    app.register_blueprint(analyze_bp, url_prefix="/api")
    app.register_blueprint(applications_bp, url_prefix="/api")
    app.register_blueprint(jobs_bp, url_prefix="/api")
    app.register_blueprint(apply_bp, url_prefix="/api")
    app.register_blueprint(interview_bp, url_prefix="/api")
    
    @app.route("/api/health")
    def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "service": "ApplyBot Pro API"}
    
    return app


if __name__ == "__main__":
    app = create_app()
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
