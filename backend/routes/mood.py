from flask import Blueprint, request, jsonify
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import datetime
import os

from db.models import Mood

mood_bp = Blueprint('mood', __name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///chanakya.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@mood_bp.route('', methods=['POST'])
def log_mood():
    data = request.json
    user_id = data.get('user_id', 'default')
    mood = data.get('mood', 'neutral')
    timestamp = datetime.datetime.utcnow()
    if not mood:
        return jsonify({"error": "Mood is required."}), 400

    db = SessionLocal()
    try:
        mood_entry = Mood(
            user_id=user_id if isinstance(user_id, int) else None,
            mood=mood,
            timestamp=timestamp
        )
        db.add(mood_entry)
        db.commit()
    finally:
        db.close()

    # Return last 7 moods for dashboard
    db = SessionLocal()
    try:
        moods = db.query(Mood).filter(Mood.user_id == (user_id if isinstance(user_id, int) else None)).order_by(Mood.timestamp.desc()).limit(7).all()
        mood_history = [
            {"mood": m.mood, "timestamp": m.timestamp.isoformat()} for m in reversed(moods)
        ]
    finally:
        db.close()

    return jsonify({"status": "success", "mood": mood, "timestamp": timestamp.isoformat(), "history": mood_history})
