from datetime import datetime

from sqlalchemy import Column, DateTime, func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo


class PropertyPhoto(SQLModel, table=True):
    __tablename__ = "property_photos"

    id: int = Field(primary_key=True)
    url: str = Field(max_length=500)
    sort_order: int = Field(default=0)
    is_main: bool = Field(default=False)
    property_id: int = Field(foreign_key="properties.id")
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )


class PhotosRepo(BaseRepo):
    async def list_by_property(self, property_id: int) -> list[PropertyPhoto]:
        async with self._session() as session:
            stmt = (
                select(PropertyPhoto)
                .where(col(PropertyPhoto.property_id) == property_id)
                .order_by(col(PropertyPhoto.sort_order).asc())
            )
            result = await session.execute(stmt)

            return list(result.scalars().all())

    async def list_by_property_ids(self, property_ids: list[int]) -> dict[int, list[PropertyPhoto]]:
        if not property_ids:
            return {}

        unique_ids = list(dict.fromkeys(property_ids))

        async with self._session() as session:
            stmt = (
                select(PropertyPhoto)
                .where(col(PropertyPhoto.property_id).in_(unique_ids))
                .order_by(col(PropertyPhoto.property_id).asc(), col(PropertyPhoto.sort_order).asc())
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

        by_prop: dict[int, list[PropertyPhoto]] = {}

        for photo in rows:
            by_prop.setdefault(photo.property_id, []).append(photo)

        return by_prop

    async def count_by_property(self, property_id: int) -> int:
        async with self._session() as session:
            stmt = (
                select(func.count())
                .select_from(PropertyPhoto)
                .where(col(PropertyPhoto.property_id) == property_id)
            )
            result = await session.execute(stmt)

            return int(result.scalar_one())

    async def get_by_id_and_property(
        self,
        photo_id: int,
        property_id: int,
    ) -> PropertyPhoto | None:
        async with self._session() as session:
            stmt = select(PropertyPhoto).where(
                col(PropertyPhoto.id) == photo_id,
                col(PropertyPhoto.property_id) == property_id,
            )
            result = await session.execute(stmt)

            return result.scalar_one_or_none()

    async def create(
        self,
        *,
        property_id: int,
        url: str,
        sort_order: int,
        is_main: bool,
    ) -> PropertyPhoto:
        photo = PropertyPhoto(
            property_id=property_id,
            url=url,
            sort_order=sort_order,
            is_main=is_main,
        )

        async with self._session() as session:
            session.add(photo)
            await session.commit()
            await session.refresh(photo)

            return photo

    async def update(
        self,
        photo_id: int,
        property_id: int,
        *,
        url: str | None,
        sort_order: int | None,
        is_main: bool | None,
    ) -> PropertyPhoto | None:
        async with self._session() as session:
            photo = await session.get(PropertyPhoto, photo_id)

            if photo is None or photo.property_id != property_id:
                return None

            if url is not None:
                photo.url = url

            if sort_order is not None:
                photo.sort_order = sort_order

            if is_main is not None:
                photo.is_main = is_main

            session.add(photo)
            await session.commit()
            await session.refresh(photo)

            return photo

    async def delete(self, photo_id: int, property_id: int) -> bool:
        async with self._session() as session:
            photo = await session.get(PropertyPhoto, photo_id)

            if photo is None or photo.property_id != property_id:
                return False

            await session.delete(photo)
            await session.commit()

            return True
