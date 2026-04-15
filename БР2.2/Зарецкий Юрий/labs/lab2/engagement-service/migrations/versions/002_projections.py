"""Проекции объектов и сделок для Kafka read-model.

Revision ID: 002_projections
Revises: 001_initial
Create Date: 2026-04-13

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002_projections"
down_revision: str | None = "001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "property_projections",
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("property_id"),
    )
    op.create_table(
        "deal_projections",
        sa.Column("deal_id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("deal_id"),
    )


def downgrade() -> None:
    op.drop_table("deal_projections")
    op.drop_table("property_projections")
