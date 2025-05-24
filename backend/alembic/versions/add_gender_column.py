"""Add gender column to users table

Revision ID: add_gender_column
Revises: 5dfc1335134c
Create Date: 2025-05-24 05:52:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_gender_column'
down_revision = '5dfc1335134c'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite doesn't support adding NOT NULL columns with a default value
    # in a single ALTER TABLE statement, so we'll do it in multiple steps
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('gender', sa.String(10), nullable=True, server_default='neutral'))
        
    # Update existing rows to have a default value
    op.execute("UPDATE users SET gender = 'neutral' WHERE gender IS NULL")
    
    # Now alter the column to be NOT NULL
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('gender', existing_type=sa.String(10), nullable=False)


def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('gender')
