"""Initial database migration

Revision ID: initial
Revises: 
Create Date: 2025-05-23 08:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create all tables from models
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('mobile_number', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('gender', sa.String(10), nullable=False, server_default='neutral'),
        sa.Column('password_hash', sa.String(), nullable=False)
    )
    
    op.create_table(
        'budgets',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('income', sa.Float(), nullable=True),
        sa.Column('expenses', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    op.create_table(
        'moods',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('mood', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    
    op.create_table(
        'chat_history',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('message', sa.String(), nullable=True),
        sa.Column('response', sa.String(), nullable=True)
    )
    
    op.create_table(
        'mood_sessions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('perma_scores', sa.JSON(), nullable=True),
        sa.Column('answers', sa.JSON(), nullable=True),
        sa.Column('summary', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

def downgrade():
    op.drop_table('mood_sessions')
    op.drop_table('chat_history')
    op.drop_table('moods')
    op.drop_table('budgets')
    op.drop_table('users')
