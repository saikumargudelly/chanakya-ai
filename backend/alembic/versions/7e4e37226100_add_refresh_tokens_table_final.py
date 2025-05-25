"""add_refresh_tokens_table_final

Revision ID: 7e4e37226100
Revises: fda0a942f167
Create Date: 2025-05-25 01:12:37.055184

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e4e37226100'
down_revision: Union[str, None] = 'fda0a942f167'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create refresh_tokens table
    op.create_table('refresh_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=512), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('revoked_by_ip', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=512), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    
    # Create index on token for faster lookups
    op.create_index('ix_refresh_tokens_token', 'refresh_tokens', ['token'], unique=True)
    
    # Create index on user_id for faster lookups
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    
    # Add foreign key constraint
    with op.batch_alter_table('refresh_tokens') as batch_op:
        batch_op.create_foreign_key(
            'fk_refresh_tokens_user_id',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key constraint
    with op.batch_alter_table('refresh_tokens') as batch_op:
        batch_op.drop_constraint('fk_refresh_tokens_user_id', type_='foreignkey')
    
    # Drop indexes
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_token', table_name='refresh_tokens')
    
    # Drop the table
    op.drop_table('refresh_tokens')
