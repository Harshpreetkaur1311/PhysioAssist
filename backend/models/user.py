from datetime import datetime, timezone
from bson import ObjectId
from db import users_col


def _serialize(user: dict) -> dict:
    """Convert MongoDB document to JSON-safe dict."""
    if user is None:
        return None
    user["_id"] = str(user["_id"])
    return user


def find_or_create_user(google_data: dict) -> dict:
    """
    Upsert a user from Google OAuth payload.
    google_data must contain: google_id, email, name, picture
    Returns the serialized user document.
    """
    col = users_col()
    now = datetime.now(timezone.utc)

    # Try to find existing user
    existing = col.find_one({"google_id": google_data["google_id"]})

    if existing:
        # Update last_login and refresh profile info
        col.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "last_login": now,
                    "name": google_data.get("name", existing.get("name")),
                    "picture": google_data.get("picture", existing.get("picture")),
                    "email": google_data.get("email", existing.get("email")),
                }
            },
        )
        existing["last_login"] = now
        return _serialize(existing)

    # Create new user
    new_user = {
        "google_id": google_data["google_id"],
        "email": google_data["email"],
        "name": google_data.get("name", ""),
        "picture": google_data.get("picture", ""),
        "created_at": now,
        "last_login": now,
    }
    result = col.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return _serialize(new_user)


def get_user_by_id(user_id: str) -> dict:
    """Fetch a user document by its MongoDB _id string."""
    try:
        doc = users_col().find_one({"_id": ObjectId(user_id)})
        return _serialize(doc)
    except Exception:
        return None
