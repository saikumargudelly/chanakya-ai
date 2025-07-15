"""Make target_amount nullable

Revision ID: 36e9e8bbc4e9
Revises: c63c3b0f7710
Create Date: 2025-06-26 18:41:43.560494

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '36e9e8bbc4e9'
down_revision: Union[str, None] = 'c63c3b0f7710'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands for SQLite - recreate table with nullable target_amount ###
    conn = op.get_bind()
    # 1. Rename the old table
    op.rename_table('goals', 'goals_old')

    # 2. Create the new table with target_amount nullable
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('target_amount', sa.Float, nullable=True),
        sa.Column('current_amount', sa.Float, nullable=False, default=0.0),
        sa.Column('deadline', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=True),
        sa.Column('milestone_frequency', sa.String(50), nullable=True),
        sa.Column('milestones', sa.JSON, nullable=True),
        sa.Column('reminders', sa.JSON, nullable=True),
        sa.Column('vision', sa.String, nullable=True),
        sa.Column('mood_aware', sa.Boolean, nullable=True),
        sa.Column('updated_at', sa.DateTime, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
    )

    # 3. Copy data from old table to new table
    conn.execute(sa.text("""
        INSERT INTO goals (
            id, user_id, title, description, target_amount, current_amount, deadline, created_at, milestone_frequency, milestones, reminders, vision, mood_aware, updated_at, is_active
        )
        SELECT
            id, user_id, title, description, target_amount, current_amount, deadline, created_at, milestone_frequency, milestones, reminders, vision, mood_aware, updated_at, is_active
        FROM goals_old;
    """))

    # 4. Drop the old table
    op.drop_table('goals_old')


def downgrade() -> None:
    # Downgrade: make target_amount NOT NULL again (reverse the process)
    conn = op.get_bind()
    op.rename_table('goals', 'goals_old')
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('target_amount', sa.Float, nullable=False),
        sa.Column('current_amount', sa.Float, nullable=False, default=0.0),
        sa.Column('deadline', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=True),
        sa.Column('milestone_frequency', sa.String(50), nullable=True),
        sa.Column('milestones', sa.JSON, nullable=True),
        sa.Column('reminders', sa.JSON, nullable=True),
        sa.Column('vision', sa.String, nullable=True),
        sa.Column('mood_aware', sa.Boolean, nullable=True),
        sa.Column('updated_at', sa.DateTime, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
    )
    conn.execute(sa.text("""
        INSERT INTO goals (
            id, user_id, title, description, target_amount, current_amount, deadline, created_at, milestone_frequency, milestones, reminders, vision, mood_aware, updated_at, is_active
        )
        SELECT
            id, user_id, title, description, target_amount, current_amount, deadline, created_at, milestone_frequency, milestones, reminders, vision, mood_aware, updated_at, is_active
        FROM goals_old;
    """))
    op.drop_table('goals_old')
