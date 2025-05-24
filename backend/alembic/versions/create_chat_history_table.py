"""create chat_history table

Revision ID: create_chat_history_table
Revises: add_gender_column
Create Date: 2025-05-24 06:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'create_chat_history_table'
down_revision = 'add_gender_column'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('chat_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('message', sa.String(), nullable=True),  # For backward compatibility
        sa.Column('response', sa.String(), nullable=True),  # For backward compatibility
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('chat_history')
