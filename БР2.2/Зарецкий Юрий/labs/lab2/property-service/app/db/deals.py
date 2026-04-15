from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Text, func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo
from app.enums import DealStatus
from app.schemas.dto import DealListParams, RentDealCreateDTO


class RentDeal(SQLModel, table=True):
    __tablename__ = "rent_deals"

    id: int = Field(primary_key=True)
    start_date: date = Field(sa_column=Column(Date, nullable=False))
    end_date: date = Field(sa_column=Column(Date, nullable=False))
    status: str = Field(default=DealStatus.REQUESTED.value, max_length=20)
    total_price: float
    comment: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    cancellation_reason: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    property_id: int = Field(foreign_key="properties.id")
    tenant_id: int
    owner_id: int
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )


class DealsRepo(BaseRepo):
    async def create(self, data: RentDealCreateDTO) -> RentDeal:
        deal = RentDeal(
            start_date=data.start_date,
            end_date=data.end_date,
            total_price=data.total_price,
            comment=data.comment,
            property_id=data.property_id,
            tenant_id=data.tenant_id,
            owner_id=data.owner_id,
            status=data.status,
        )

        async with self._session() as session:
            session.add(deal)
            await session.commit()
            await session.refresh(deal)

            return deal

    async def get_by_id(self, deal_id: int) -> RentDeal | None:
        async with self._session() as session:
            return await session.get(RentDeal, deal_id)

    async def list_by_property(self, property_id: int, params: DealListParams) -> tuple[list[RentDeal], int]:
        async with self._session() as session:
            base = select(RentDeal).where(col(RentDeal.property_id) == property_id)
            count_base = select(func.count()).select_from(RentDeal).where(col(RentDeal.property_id) == property_id)

            if params.status is not None:
                st_cond = col(RentDeal.status) == params.status
                base = base.where(st_cond)
                count_base = count_base.where(st_cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = (
                base.order_by(col(RentDeal.created_at).desc())
                .offset((params.page - 1) * params.limit)
                .limit(params.limit)
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def list_by_tenant(
        self,
        tenant_id: int,
        *,
        page: int,
        limit: int,
    ) -> tuple[list[RentDeal], int]:
        async with self._session() as session:
            cond = col(RentDeal.tenant_id) == tenant_id
            count_base = select(func.count()).select_from(RentDeal).where(cond)
            base = select(RentDeal).where(cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = base.order_by(col(RentDeal.created_at).desc()).offset((page - 1) * limit).limit(limit)
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def list_by_owner(
        self,
        owner_id: int,
        *,
        page: int,
        limit: int,
    ) -> tuple[list[RentDeal], int]:
        async with self._session() as session:
            cond = col(RentDeal.owner_id) == owner_id
            count_base = select(func.count()).select_from(RentDeal).where(cond)
            base = select(RentDeal).where(cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = base.order_by(col(RentDeal.created_at).desc()).offset((page - 1) * limit).limit(limit)
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def update_status(
        self,
        deal_id: int,
        *,
        status: str,
        cancellation_reason: str | None,
    ) -> RentDeal | None:
        async with self._session() as session:
            deal = await session.get(RentDeal, deal_id)

            if deal is None:
                return None

            deal.status = status

            if cancellation_reason is not None:
                deal.cancellation_reason = cancellation_reason

            session.add(deal)
            await session.commit()
            await session.refresh(deal)

            return deal

    async def count_conflicts(
        self,
        *,
        property_id: int,
        start_date: date,
        end_date: date,
    ) -> int:
        async with self._session() as session:
            stmt = (
                select(func.count())
                .select_from(RentDeal)
                .where(col(RentDeal.property_id) == property_id)
                .where(col(RentDeal.status) != DealStatus.CANCELLED.value)
                .where(col(RentDeal.start_date) <= end_date)
                .where(col(RentDeal.end_date) >= start_date)
            )
            result = await session.execute(stmt)

            return int(result.scalar_one())
