import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, request, make_response
from flask_cors import CORS

from config import SECRET_KEY
from db import get_db
from routes.auth import auth_bp
from routes.sessions import sessions_bp
from routes.exercises import exercises_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://physio-assist-kappa.vercel.app",
    ]

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers["Access-Control-Allow-Origin"] = "https://physio-assist-kappa.vercel.app"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
            return response

    @app.after_request
    def after_request(response):
        origin = request.headers.get("Origin")
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    app.register_blueprint(auth_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(exercises_bp)

    @app.route("/api/health")
    def health():
        try:
            db = get_db()
            db.client.admin.command("ping")
            return jsonify({"status": "ok", "db": "connected"}), 200
        except Exception as e:
            return jsonify({"status": "error", "db": str(e)}), 500

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
    app.run(host="0.0.0.0", port=5000, debug=True)
