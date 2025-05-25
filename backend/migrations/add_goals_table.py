"""Add goals table

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2024-05-24 16:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create the goals table
    op.create_table(
        'goals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('target_amount', sa.Float(), nullable=False),
        sa.Column('deadline_months', sa.Integer(), nullable=False),
        sa.Column('saved_amount', sa.Float(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create an index on user_id for faster lookups
    op.create_index('idx_goals_user_id', 'goals', ['user_id'], unique=False)

def downgrade():
    # Drop the index first to avoid dependency issues
    op.drop_index('idx_goals_user_id', table_name='goals')
    
    # Drop the goals table
    op.drop_table('goals')
