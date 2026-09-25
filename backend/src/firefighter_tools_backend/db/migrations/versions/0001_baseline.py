"""Baseline: the schema that ``Base.metadata.create_all`` built before Alembic.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-09-25
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=150), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=True),
        sa.Column("surname", sa.String(length=150), nullable=True),
        sa.Column("rank", sa.String(length=100), nullable=True),
        sa.Column("zug", sa.String(length=100), nullable=True),
        sa.Column("gruppe", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_table(
        "active_schedule",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("stored_filename", sa.String(length=80), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("uploaded_by_user_id", sa.Integer(), nullable=True),
        sa.Column(
            "uploaded_by_username",
            sa.String(length=150),
            nullable=False,
        ),
        sa.CheckConstraint("id = 1", name="ck_active_schedule_singleton"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("active_schedule")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
