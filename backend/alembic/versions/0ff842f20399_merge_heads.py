"""merge heads

Revision ID: 0ff842f20399
Revises: add_gender_column, fbd1836b3397
Create Date: 2025-05-24 11:24:33.511006

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ff842f20399'
down_revision: Union[str, None] = ('add_gender_column', 'fbd1836b3397')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
