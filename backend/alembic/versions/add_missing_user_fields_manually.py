"""Add missing user profile fields

Revision ID: 8f912c704219
Revises: 25b9e3bbc594
Create Date: 2025-06-09 09:43:30.807326
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8f912c704219'
down_revision = '25b9e3bbc594'
branch_labels = None
depends_on = None

def upgrade():
    # Add missing columns to users table
    op.add_column('users', sa.Column('date_of_birth', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('address', sa.String(), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(), nullable=True))
    op.add_column('users', sa.Column('state', sa.String(), nullable=True))
    op.add_column('users', sa.Column('country', sa.String(), nullable=True))
    op.add_column('users', sa.Column('postal_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))

def downgrade():
    # Remove the columns if rolling back
    op.drop_column('users', 'bio')
    op.drop_column('users', 'postal_code')
    op.drop_column('users', 'country')
    op.drop_column('users', 'state')
    op.drop_column('users', 'city')
    op.drop_column('users', 'address')
    op.drop_column('users', 'date_of_birth')
