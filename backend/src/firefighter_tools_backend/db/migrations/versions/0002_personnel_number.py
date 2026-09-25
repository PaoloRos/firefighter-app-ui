"""Add an optional, unique personnel number to accounts.

SQLite cannot add a column carrying a UNIQUE constraint, so uniqueness comes
from a unique index, which also admits any number of accounts without one.

Revision ID: 0002_personnel_number
Revises: 0001_baseline
Create Date: 2026-09-25
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_personnel_number"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("personnel_number", sa.String(length=50), nullable=True),
    )
    op.create_index(
        "ix_users_personnel_number",
        "users",
        ["personnel_number"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_personnel_number", table_name="users")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("personnel_number")
