from datetime import datetime, timezone
from bson import ObjectId
from db import sessions_col


def _serialize(doc: dict) -> dict:
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    return doc


def create_session(user_id: str, exercise_type: str = "squats") -> dict:
    """
    Insert a new session document and return it.
    Called when the user starts a workout.
    """
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": ObjectId(user_id),
        "exercise_type": exercise_type,
        "started_at": now,
        "ended_at": None,
        "duration_seconds": 0,
        "total_reps": 0,
        "total_score": 0,
        "avg_score_per_rep": 0.0,
        "feedback_summary": [],
        "status": "active",       # "active" | "completed"
    }
    result = sessions_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


def end_session(session_id: str, total_reps: int, total_score: int,
                feedback_summary: list) -> dict:
    """
    Finalize a session: fill in end time, totals, and average score.
    """
    col = sessions_col()
    session = col.find_one({"_id": ObjectId(session_id)})
    if not session:
        return None

    now = datetime.now(timezone.utc)
    started_at = session.get("started_at", now)
    duration = int((now - started_at).total_seconds())
    avg = round(total_score / total_reps, 2) if total_reps > 0 else 0.0

    col.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "ended_at": now,
                "duration_seconds": duration,
                "total_reps": total_reps,
                "total_score": total_score,
                "avg_score_per_rep": avg,
                "feedback_summary": list(set(feedback_summary)),  # deduplicate
                "status": "completed",
            }
        },
    )
    session.update({
        "ended_at": now,
        "duration_seconds": duration,
        "total_reps": total_reps,
        "total_score": total_score,
        "avg_score_per_rep": avg,
        "feedback_summary": list(set(feedback_summary)),
        "status": "completed",
    })
    return _serialize(session)


def get_user_sessions(user_id: str) -> list:
    """Return all sessions for a user, newest first."""
    cursor = sessions_col().find(
        {"user_id": ObjectId(user_id)},
        sort=[("started_at", -1)]
    )
    return [_serialize(doc) for doc in cursor]


def get_session_by_id(session_id: str) -> dict:
    """Return a single session by its ID."""
    try:
        doc = sessions_col().find_one({"_id": ObjectId(session_id)})
        return _serialize(doc)
    except Exception:
        return None
