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
    email = data.get('email')
    password = data.get('password')
    gender = data.get('gender', 'neutral')  # Default to 'neutral' if not provided
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    if gender not in ['male', 'female', 'neutral']:
        return jsonify({'error': 'Invalid gender. Must be one of: male, female, neutral'}), 400
        
    with Session(engine) as session:
        if session.query(User).filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
            
        hashed = generate_password_hash(password)
        user = User(
            email=email, 
            password_hash=hashed,
            gender=gender,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )
        session.add(user)
        session.commit()
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user.id,
            'email': user.email,
            'gender': user.gender
        })

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    with Session(engine) as session:
        user = session.query(User).filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'gender': user.gender,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=6)
        }, SECRET_KEY, algorithm='HS256')
        return jsonify({
            'token': token, 
            'user_id': user.id, 
            'email': user.email,
            'gender': user.gender
        })

# Helper to decode token and get user_id
def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except Exception:
        return None


def get_current_user():
    auth_header = request.headers.get('Authorization', None)
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    user_id = decode_token(token)
    if not user_id:
        return None
    with Session(engine) as session:
        user = session.query(User).filter_by(id=user_id).first()
        return user

@bp.route('/profile', methods=['GET'])
def get_profile():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Token is missing'}), 401
    try:
        user_id = decode_token(token.split(' ')[1])
        with Session(engine) as session:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            return jsonify({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'gender': user.gender,
                'mobile_number': user.mobile_number,
                'address': user.address
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/reset_password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')
    if not email or not new_password:
        return jsonify({'error': 'Email and new_password required'}), 400
    with Session(engine) as session:
        user = session.query(User).filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user.password_hash = generate_password_hash(new_password)
        session.merge(user)
        session.commit()
        return jsonify({'message': 'Password updated successfully'})

@bp.route('/profile', methods=['PUT'])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.json
    required_fields = ['email']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    # Update profile fields
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.email = data.get('email', user.email)
    user.mobile_number = data.get('mobile_number', user.mobile_number)
    user.address = data.get('address', user.address)
    if 'gender' in data and data['gender'] in ['male', 'female', 'neutral']:
        user.gender = data['gender']
    with Session(engine) as session:
        session.merge(user)
        session.commit()
    return jsonify({'message': 'Profile updated successfully'})
