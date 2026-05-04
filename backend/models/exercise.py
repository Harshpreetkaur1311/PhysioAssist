from datetime import datetime, timezone
from bson import ObjectId
from db import exercises_col


def _serialize(doc: dict) -> dict:
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    doc["session_id"] = str(doc["session_id"])
    doc["user_id"] = str(doc["user_id"])
    return doc


def log_rep(session_id: str, user_id: str, rep_data: dict) -> dict:
    """
    Log a single exercise rep to the database.

    rep_data expected keys:
        rep_number   (int)
        score        (int)   e.g. 10
        feedback     (str)   e.g. "Perfect Squat"
        knee_angle   (float) optional
        back_angle   (float) optional
    """
    doc = {
        "session_id": ObjectId(session_id),
        "user_id": ObjectId(user_id),
        "rep_number": rep_data.get("rep_number", 0),
        "score": rep_data.get("score", 0),
        "feedback": rep_data.get("feedback", ""),
        "knee_angle": rep_data.get("knee_angle", None),
        "back_angle": rep_data.get("back_angle", None),
        "timestamp": datetime.now(timezone.utc),
    }
    result = exercises_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


def get_session_reps(session_id: str) -> list:
    """Return all reps for a session, ordered by rep number."""
    cursor = exercises_col().find(
        {"session_id": ObjectId(session_id)},
        sort=[("rep_number", 1)]
    )
    return [_serialize(doc) for doc in cursor]


def get_user_rep_count(user_id: str) -> int:
    """Return the total number of reps a user has ever done."""
    return exercises_col().count_documents({"user_id": ObjectId(user_id)})


def get_weekly_progress(user_id: str) -> list:
    """
    Return a list of daily rep counts for the last 7 days.
    Format: [{"day": "Mon", "reps": 15}, ...]
    """
    from datetime import timedelta
    
    col = exercises_col()
    now = datetime.now(timezone.utc)
    
    # We want labels for the last 7 days
    results = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_label = day_date.strftime("%a")
        
        # Start and end of the day
        start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        count = col.count_documents({
            "user_id": ObjectId(user_id),
            "timestamp": {"$gte": start, "$lte": end}
        })
        
        results.append({"day": day_label, "reps": count})
        
    return results
