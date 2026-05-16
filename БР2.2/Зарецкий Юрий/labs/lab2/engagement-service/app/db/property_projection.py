from datetime import datetime

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, SQLModel

from app.db.base import BaseRepo


class PropertyProjection(SQLModel, table=True):
    __tablename__ = "property_projections"

    property_id: int = Field(primary_key=True)
    owner_id: int
    is_active: bool
    is_deleted: bool = Field(default=False)
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )


class PropertyProjectionRepo(BaseRepo):
    async def get_by_property_id(self, property_id: int) -> PropertyProjection | None:
        async with self._session() as session:
            return await session.get(PropertyProjection, property_id)

    async def upsert_from_event(
        self,
        *,
        property_id: int,
        owner_id: int,
        is_active: bool,
        is_deleted: bool,
    ) -> None:
        async with self._session() as session:
            row = await session.get(PropertyProjection, property_id)

            if row is None:
                row = PropertyProjection(
                    property_id=property_id,
                    owner_id=owner_id,
                    is_active=is_active,
                    is_deleted=is_deleted,
                )
                session.add(row)
            else:
                row.owner_id = owner_id
                row.is_active = is_active
                row.is_deleted = is_deleted

