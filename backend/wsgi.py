"""
WSGI entry point for production deployment.
Render/Gunicorn uses this file to start the app.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
