"""Add gender to users

Revision ID: add_gender_to_users
Revises: 
Create Date: 2025-05-23 08:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_gender_to_users'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add the gender column with a default value of 'neutral'
    op.add_column('users', 
        sa.Column('gender', sa.String(10), nullable=False, server_default='neutral')
    )

def downgrade():
    # Remove the gender column if rolling back
    op.drop_column('users', 'gender')
