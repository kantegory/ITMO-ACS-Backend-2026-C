"""Локальная проекция пользователей Identity (read-model).

Revision ID: 002_user_projections
Revises: 001_initial
Create Date: 2026-04-13

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002_user_projections"
down_revision: str | None = "001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_projections",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_projections")
