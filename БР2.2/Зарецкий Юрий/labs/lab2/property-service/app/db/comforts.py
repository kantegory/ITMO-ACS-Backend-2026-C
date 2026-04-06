from sqlalchemy import select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo


class Comfort(SQLModel, table=True):
    __tablename__ = "comforts"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=100)
    icon: str | None = Field(default=None, max_length=200)


class ComfortsRepo(BaseRepo):
    async def list_all_ordered(self) -> list[Comfort]:
        async with self._session() as session:
            stmt = select(Comfort).order_by(col(Comfort.name).asc())
            result = await session.execute(stmt)

            return list(result.scalars().all())

    async def get_by_id(self, comfort_id: int) -> Comfort | None:
        async with self._session() as session:
            return await session.get(Comfort, comfort_id)

    async def get_by_ids(self, comfort_ids: list[int]) -> list[Comfort]:
        if not comfort_ids:
            return []

        unique = list(dict.fromkeys(comfort_ids))

        async with self._session() as session:
            stmt = select(Comfort).where(col(Comfort.id).in_(unique))
            result = await session.execute(stmt)

            return list(result.scalars().all())

    async def create(self, name: str, icon: str | None) -> Comfort:
        comfort = Comfort(name=name, icon=icon)

        async with self._session() as session:
            session.add(comfort)
            await session.commit()
            await session.refresh(comfort)

            return comfort

    async def update(self, comfort_id: int, *, name: str, icon: str | None) -> Comfort | None:
        async with self._session() as session:
            comfort = await session.get(Comfort, comfort_id)

            if comfort is None:
                return None

            comfort.name = name
            comfort.icon = icon
            session.add(comfort)
            await session.commit()
            await session.refresh(comfort)

            return comfort

    async def delete(self, comfort_id: int) -> bool:
        async with self._session() as session:
            comfort = await session.get(Comfort, comfort_id)

            if comfort is None:
                return False

            await session.delete(comfort)
            await session.commit()

            return True
