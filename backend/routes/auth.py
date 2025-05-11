from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from sqlalchemy.orm import Session
from db.models import User
from db.session import engine, SessionLocal
from db.models import Base

SECRET_KEY = 'your-very-secure-secret-key'  # Change this in production

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    with Session(engine) as session:
        if session.query(User).filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        hashed = generate_password_hash(password)
        user = User(username=username, password_hash=hashed)
        session.add(user)
        session.commit()
        return jsonify({'message': 'User registered successfully'})

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    with Session(engine) as session:
        user = session.query(User).filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=6)
        }, SECRET_KEY, algorithm='HS256')
        return jsonify({'token': token, 'user_id': user.id})

# Helper to decode token and get user_id
def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except Exception:
        return None
