import os
from pymongo import MongoClient
import mongomock
from config import MONGO_URI

# Singleton MongoDB client
_client = None
_db = None


def get_db():
    """Return the database instance, creating it if necessary."""
    global _client, _db
    if _db is None:
        if os.getenv("RENDER") and "localhost" in MONGO_URI:
            print("Using mongomock (in-memory db) as fallback on Render")
            _client = mongomock.MongoClient()
            _db = _client.physioassist_db
        else:
            _client = MongoClient(MONGO_URI)
            _db = _client.get_default_database()
            
        _ensure_indexes(_db)
    return _db


def _ensure_indexes(db):
    """Create indexes for faster queries on startup."""
    # users: unique on google_id and email
    db.users.create_index("google_id", unique=True)
    db.users.create_index("email", unique=True)

    # sessions: query by user_id, sort by started_at
    db.sessions.create_index([("user_id", 1), ("started_at", -1)])

    # exercises: query by session_id
    db.exercises.create_index([("session_id", 1), ("rep_number", 1)])


# Convenience accessors — use these in models
def users_col():
    return get_db().users


def sessions_col():
    return get_db().sessions


def exercises_col():
    return get_db().exercises
