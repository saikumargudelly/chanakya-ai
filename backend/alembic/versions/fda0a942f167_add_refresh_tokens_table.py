"""add_refresh_tokens_table

Revision ID: fda0a942f167
Revises: 74bd31b00ad3
Create Date: 2025-05-25 01:11:35.498750

"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = 'fda0a942f167'
down_revision: Union[str, None] = '74bd31b00ad3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create refresh_tokens table and add relationship to users."""
    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('token', sa.String(512), nullable=False, unique=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('revoked_by_ip', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(512), nullable=True),
        sqlite_autoincrement=True
    )
    
    # Add foreign key constraint
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_refresh_tokens_user_id',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )
    
    # Create index on user_id for faster lookups
    op.create_index('idx_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])


def downgrade() -> None:
    """Drop the refresh_tokens table."""
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.drop_constraint('fk_refresh_tokens_user_id', type_='foreignkey')
    
    op.drop_index('idx_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
