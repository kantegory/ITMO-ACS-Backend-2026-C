"""Начальная миграция: города, удобства, объекты, фото, сделки.

Revision ID: 001_initial
Revises:
Create Date: 2026-04-06

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "comforts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("icon", sa.String(length=200), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("price_per_day", sa.Float(), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("rooms_count", sa.Integer(), nullable=True),
        sa.Column("area", sa.Float(), nullable=True),
        sa.Column("max_guests", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("city_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["city_id"], ["cities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "property_comforts",
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("comfort_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["comfort_id"], ["comforts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("property_id", "comfort_id"),
    )
    op.create_table(
        "property_photos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_main", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "rent_deals",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="requested"),
        sa.Column("total_price", sa.Float(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("rent_deals")
    op.drop_table("property_photos")
    op.drop_table("property_comforts")
    op.drop_table("properties")
    op.drop_table("comforts")
    op.drop_table("cities")
