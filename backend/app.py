import sys
import os

# Allow imports from backend/ root regardless of how this is run
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from flask_cors import CORS

from config import SECRET_KEY
from db import get_db
from routes.auth import auth_bp
from routes.sessions import sessions_bp
from routes.exercises import exercises_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    # Allow requests from the Vite dev server
    CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://physio-assist-kappa.vercel.app"
    ],
    supports_credentials=True
)
    @app.after_request
    def after_request(response):
        response.headers.add(
            "Access-Control-Allow-Origin",
            "https://physio-assist-kappa.vercel.app"
        )
        response.headers.add(
            "Access-Control-Allow-Headers",
            "Content-Type,Authorization"
        )
        response.headers.add(
            "Access-Control-Allow-Methods",
            "GET,POST,PUT,DELETE,OPTIONS"
        )
        return response

    # ── Register blueprints ────────────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(exercises_bp)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        try:
            db = get_db()
            # Ping MongoDB — raises if unreachable
            db.client.admin.command("ping")
            return jsonify({"status": "ok", "db": "connected"}), 200
        except Exception as e:
            return jsonify({"status": "error", "db": str(e)}), 500

    # ── Generic error handlers ─────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Route not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    print("PhysioAssist Backend running on http://localhost:5000")
    print("Routes:")
    print("   POST  /api/auth/google      - verify Google token -> get JWT")
    print("   GET   /api/auth/me          - get current user")
    print("   POST  /api/sessions/start   - start a workout session")
    print("   PUT   /api/sessions/:id/end - end session with stats")
    print("   GET   /api/sessions/        - list user sessions")
    print("   GET   /api/sessions/:id     - get session + reps")
    print("   POST  /api/exercises/log    - log a single rep")
    print("   GET   /api/exercises/:id    - get reps for session")
    print("   GET   /api/exercises/stats  - lifetime rep count")
    print("   GET   /api/health           - DB health check")
    app.run(host="0.0.0.0", port=5000, debug=True)
