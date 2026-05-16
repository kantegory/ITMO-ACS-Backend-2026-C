from datetime import datetime

from sqlalchemy import Column, DateTime, func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo


class DealProjection(SQLModel, table=True):
    __tablename__ = "deal_projections"

    deal_id: int = Field(primary_key=True)
    property_id: int
    tenant_id: int
    owner_id: int
    status: str
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )


class DealProjectionRepo(BaseRepo):
    async def upsert_from_event(
        self,
        *,
        deal_id: int,
        property_id: int,
        tenant_id: int,
        owner_id: int,
        status: str,
    ) -> None:
        async with self._session() as session:
            row = await session.get(DealProjection, deal_id)

            if row is None:
                row = DealProjection(
                    deal_id=deal_id,
                    property_id=property_id,
                    tenant_id=tenant_id,
                    owner_id=owner_id,
                    status=status,
                )
                session.add(row)
            else:
                row.property_id = property_id
                row.tenant_id = tenant_id
                row.owner_id = owner_id
                row.status = status

    async def has_approved_for_tenant(self, property_id: int, tenant_id: int) -> bool:
        async with self._session() as session:
            stmt = (
                select(func.count())
                .select_from(DealProjection)
                .where(col(DealProjection.property_id) == property_id)
                .where(col(DealProjection.tenant_id) == tenant_id)
                .where(col(DealProjection.status) == "approved")
            )
            result = await session.execute(stmt)
            count = int(result.scalar_one())

            return count > 0
