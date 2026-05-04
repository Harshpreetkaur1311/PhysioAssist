from flask import Blueprint, request, jsonify
import json
import os

from routes.auth import require_auth
from models.session import (
    create_session,
    end_session,
    get_user_sessions,
    get_session_by_id,
)
from models.exercise import get_session_reps

sessions_bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")


@sessions_bp.route("/start", methods=["POST"])
@require_auth
def start_session(current_user):
    """
    POST /api/sessions/start
    Body (optional): { "exercise_type": "squats" }

    Creates a new active session for the logged-in user.
    Returns the new session document including its ID.
    """
    data = request.get_json(silent=True) or {}
    exercise_type = data.get("exercise_type", "squats")

    session = create_session(
        user_id=current_user["_id"],
        exercise_type=exercise_type,
    )

    # ── Write session_context.json for the AI Engine Handshake ─────────────────
    try:
        # Get the token from the header (it's verified by require_auth)
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header else ""

        context = {
            "session_id": str(session["_id"]),
            "token": token,
            "exercise_type": exercise_type,
            "user_id": str(current_user["_id"]),
            "user_name": current_user.get("name", "User")
        }
        
        # Path: root of PhysioAssist (parent of backend/)
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        ctx_path = os.path.join(root_dir, "session_context.json")
        
        with open(ctx_path, "w") as f:
            json.dump(context, f, indent=2)
        print(f"[OK] AI Context written to {ctx_path}")
    except Exception as e:
        print(f"[ERROR] Failed to write AI context: {e}")

    return jsonify(session), 201


@sessions_bp.route("/<session_id>/end", methods=["PUT"])
@require_auth
def end_session_route(current_user, session_id):
    """
    PUT /api/sessions/<session_id>/end
    Body: {
        "total_reps": 15,
        "total_score": 130,
        "feedback_summary": ["Perfect Squat", "Back Bent"]
    }

    Finalizes a session with workout stats.
    """
    data = request.get_json(silent=True) or {}

    # Validate session belongs to this user
    session = get_session_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session["user_id"] != current_user["_id"]:
        return jsonify({"error": "Forbidden"}), 403

    updated = end_session(
        session_id=session_id,
        total_reps=data.get("total_reps", 0),
        total_score=data.get("total_score", 0),
        feedback_summary=data.get("feedback_summary", []),
    )
    return jsonify(updated), 200


@sessions_bp.route("/", methods=["GET"])
@require_auth
def list_sessions(current_user):
    """
    GET /api/sessions/
    Header: Authorization: Bearer <token>

    Returns all sessions for the logged-in user, newest first.
    Also includes total_reps and total_score aggregates.
    """
    sessions = get_user_sessions(current_user["_id"])

    # Compute overall stats for convenience
    total_reps = sum(s.get("total_reps", 0) for s in sessions)
    total_score = sum(s.get("total_score", 0) for s in sessions)

    return jsonify({
        "sessions": sessions,
        "stats": {
            "total_sessions": len(sessions),
            "total_reps": total_reps,
            "total_score": total_score,
        }
    }), 200


@sessions_bp.route("/<session_id>", methods=["GET"])
@require_auth
def get_session(current_user, session_id):
    """
    GET /api/sessions/<session_id>
    Header: Authorization: Bearer <token>

    Returns a single session with all its per-rep exercise data.
    """
    session = get_session_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session["user_id"] != current_user["_id"]:
        return jsonify({"error": "Forbidden"}), 403

    # Attach per-rep data
    reps = get_session_reps(session_id)
    session["reps"] = reps

    return jsonify(session), 200
