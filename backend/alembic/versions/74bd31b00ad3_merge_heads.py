"""merge heads

Revision ID: 74bd31b00ad3
Revises: 0ff842f20399, create_chat_history_table
Create Date: 2025-05-24 11:45:27.448747

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74bd31b00ad3'
down_revision: Union[str, None] = ('0ff842f20399', 'create_chat_history_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
