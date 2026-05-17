import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from config import GOOGLE_CLIENT_ID, SECRET_KEY
from models.user import find_or_create_user, get_user_by_id

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_jwt(user_id: str) -> str:
    """Create a signed JWT that expires in 7 days."""
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def _decode_jwt(token: str) -> dict | None:
    """Decode and validate a JWT. Returns payload or None."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """
    Decorator — protects a route by requiring a valid Bearer JWT.
    Injects `current_user` into the wrapped function's kwargs.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = _decode_jwt(token)
        if payload is None:
            return jsonify({"error": "Token expired or invalid"}), 401

        user = get_user_by_id(payload["sub"])
        if user is None:
            return jsonify({"error": "User not found"}), 401

        kwargs["current_user"] = user
        return f(*args, **kwargs)
    return decorated


# ─── Routes ───────────────────────────────────────────────────────────────────

@auth_bp.route("/google", methods=["POST", "OPTIONS"])
def google_login():
    if request.method == "OPTIONS":
        return "", 200
    """
    POST /api/auth/google
    Body: { "credential": "<Google ID token>" }

    Verifies the Google ID token, upserts the user in MongoDB,
    and returns a signed JWT + user profile.
    """
    data = request.get_json(silent=True)
    if not data or "credential" not in data:
        return jsonify({"error": "Missing 'credential' field"}), 400

    credential = data["credential"]

    # Verify with Google's public keys
    try:
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        current_app.logger.warning(f"Google token verification failed: {e}")
        return jsonify({"error": "Invalid Google token", "detail": str(e)}), 401

    # Extract profile from verified token
    google_data = {
        "google_id": id_info["sub"],
        "email": id_info.get("email", ""),
        "name": id_info.get("name", ""),
        "picture": id_info.get("picture", ""),
    }

    # Upsert in MongoDB
    user = find_or_create_user(google_data)

    # Issue our own JWT
    token = _make_jwt(user["_id"])

    return jsonify({
        "token": token,
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "picture": user["picture"],
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me(current_user):
    """
    GET /api/auth/me
    Header: Authorization: Bearer <token>

    Returns the authenticated user's profile.
    """
    return jsonify({
        "id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "picture": current_user["picture"],
        "created_at": current_user.get("created_at", ""),
        "last_login": current_user.get("last_login", ""),
    }), 200
