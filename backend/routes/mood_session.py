from flask import Blueprint, request, jsonify
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, and_
import datetime
import os

from db.models import MoodSession

mood_session_bp = Blueprint('mood_session', __name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///chanakya.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@mood_session_bp.route('', methods=['POST'])
def save_mood_session():
    data = request.json
    user_id = data.get('user_id', 'default')
    try:
        user_id = int(user_id)
    except Exception:
        user_id = None
    perma_scores = data.get('perma_scores')
    answers = data.get('answers')
    summary = data.get('summary', '')
    timestamp = datetime.datetime.utcnow()
    if not perma_scores or not answers:
        return jsonify({'error': 'perma_scores and answers are required'}), 400

    db = SessionLocal()
    try:
        session = MoodSession(
            user_id=user_id,
            perma_scores=perma_scores,
            answers=answers,
            summary=summary,
            timestamp=timestamp
        )
        db.add(session)
        db.commit()
        session_id = session.id
    finally:
        db.close()
    return jsonify({'status': 'success', 'session_id': session_id, 'timestamp': timestamp.isoformat()})

@mood_session_bp.route('', methods=['GET'])
def get_mood_sessions():
    user_id = request.args.get('user_id', 'default')
    try:
        user_id = int(user_id)
    except Exception:
        user_id = None
    date_str = request.args.get('date')  # Optional: YYYY-MM-DD
    db = SessionLocal()
    try:
        query = db.query(MoodSession).filter(MoodSession.user_id == user_id)
        if date_str:
            try:
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                start = datetime.datetime.combine(date, datetime.time.min)
                end = datetime.datetime.combine(date, datetime.time.max)
                query = query.filter(and_(MoodSession.timestamp >= start, MoodSession.timestamp <= end))
            except Exception:
                pass
        sessions = query.order_by(MoodSession.timestamp.desc()).all()
        result = [
            {
                'perma_scores': s.perma_scores,
                'answers': s.answers,
                'summary': s.summary,
                'timestamp': s.timestamp.isoformat()
            }
            for s in sessions
        ]
    finally:
        db.close()
    return jsonify(result)
