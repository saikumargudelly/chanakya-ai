"""add_deadline_months_to_goals

Revision ID: 8bfe4e33eda1
Revises: 8f912c704219
Create Date: 2025-06-09 14:06:06.148532

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8bfe4e33eda1'
down_revision: Union[str, None] = '8f912c704219'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add deadline_months column
    op.add_column('goals', sa.Column('deadline_months', sa.Integer(), nullable=True))
    
    # Make target_date nullable
    op.alter_column('goals', 'target_date', existing_type=postgresql.TIMESTAMP(), nullable=True)
    
    # Set default value for current_amount
    op.alter_column('goals', 'current_amount', server_default='0.0', existing_type=sa.Float(), nullable=True)
    
    # Update existing rows with a default value for deadline_months (1 year = 12 months)
    op.execute("UPDATE goals SET deadline_months = 12 WHERE deadline_months IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the deadline_months column
    op.drop_column('goals', 'deadline_months')
    
    # Make target_date non-nullable again
    op.alter_column('goals', 'target_date', existing_type=postgresql.TIMESTAMP(), nullable=False)
    
    # Remove default value from current_amount
    op.alter_column('goals', 'current_amount', server_default=None, existing_type=sa.Float(), nullable=True)
