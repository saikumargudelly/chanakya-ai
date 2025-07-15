"""initial

Revision ID: 7eef13601593
Revises: 
Create Date: 2025-06-29 12:05:35.418892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '7eef13601593'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to goals table
    op.add_column('goals', sa.Column('start_date', sa.DateTime(), nullable=True))
    op.add_column('goals', sa.Column('end_date', sa.DateTime(), nullable=True))
    op.add_column('goals', sa.Column('type', sa.String(length=50), nullable=True))
    op.add_column('goals', sa.Column('category', sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the added columns
    op.drop_column('goals', 'category')
    op.drop_column('goals', 'type')
    op.drop_column('goals', 'end_date')
    op.drop_column('goals', 'start_date')
