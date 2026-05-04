from flask import Blueprint, request, jsonify

from routes.auth import require_auth
from models.exercise import (
    log_rep, 
    get_session_reps, 
    get_user_rep_count,
    get_weekly_progress
)
from models.session import get_session_by_id, get_user_sessions

exercises_bp = Blueprint("exercises", __name__, url_prefix="/api/exercises")

@exercises_bp.route("/", methods=["GET"])
def index():
    return jsonify({"message": "PhysioAssist Exercise API is running", "endpoints": ["/log", "/stats", "/<session_id>"]}), 200


@exercises_bp.route("/log", methods=["POST"])
@require_auth
def log_exercise_rep(current_user):
    """
    POST /api/exercises/log
    Body: {
        "session_id": "<session_id>",
        "rep_number": 1,
        "score": 10,
        "feedback": "Perfect Squat",
        "knee_angle": 98.5,
        "back_angle": 85.2
    }

    Called by pose_detection.py for every completed rep.
    Validates session ownership before logging.
    """
    data = request.get_json(silent=True) or {}

    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    # Verify session belongs to this user
    session = get_session_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session["user_id"] != current_user["_id"]:
        return jsonify({"error": "Forbidden"}), 403

    rep = log_rep(
        session_id=session_id,
        user_id=current_user["_id"],
        rep_data={
            "rep_number": data.get("rep_number", 0),
            "score": data.get("score", 0),
            "feedback": data.get("feedback", ""),
            "knee_angle": data.get("knee_angle"),
            "back_angle": data.get("back_angle"),
        },
    )
    return jsonify(rep), 201


@exercises_bp.route("/<session_id>", methods=["GET"])
@require_auth
def get_reps(current_user, session_id):
    """
    GET /api/exercises/<session_id>
    Header: Authorization: Bearer <token>

    Returns all per-rep data for a session.
    """
    session = get_session_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session["user_id"] != current_user["_id"]:
        return jsonify({"error": "Forbidden"}), 403

    reps = get_session_reps(session_id)
    return jsonify({"session_id": session_id, "reps": reps}), 200


@exercises_bp.route("/stats", methods=["GET"])
@require_auth
def user_stats(current_user):
    """
    GET /api/exercises/stats
    Header: Authorization: Bearer <token>

    Returns comprehensive user stats for the dashboard.
    """
    user_id = current_user["_id"]
    
    total_reps = get_user_rep_count(user_id)
    weekly_data = get_weekly_progress(user_id)
    sessions = get_user_sessions(user_id)
    
    # Calculate simple streak (consecutive days with at least one session)
    from datetime import datetime, timedelta, timezone
    
    streak = 0
    now = datetime.now(timezone.utc).date()
    
    # Get unique dates of sessions
    session_dates = sorted(list(set(s["started_at"].date() for s in sessions if s.get("started_at"))), reverse=True)
    
    check_date = now
    for s_date in session_dates:
        if s_date == check_date:
            streak += 1
            check_date -= timedelta(days=1)
        elif s_date < check_date:
            break # Streak broken
            
    return jsonify({
        "total_reps_lifetime": total_reps,
        "total_sessions": len(sessions),
        "streak_days": streak,
        "weekly_progress": weekly_data
    }), 200
