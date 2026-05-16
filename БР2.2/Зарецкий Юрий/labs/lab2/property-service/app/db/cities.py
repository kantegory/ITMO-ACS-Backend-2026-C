from sqlalchemy import func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo


class City(SQLModel, table=True):
    __tablename__ = "cities"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=100)


class CitiesRepo(BaseRepo):
    async def list_page(
        self,
        *,
        search: str | None,
        page: int,
        limit: int,
    ) -> tuple[list[City], int]:
        async with self._session() as session:
            base = select(City)
            count_sql = select(func.count()).select_from(City)

            if search:
                pattern = f"%{search}%"
                cond = col(City.name).ilike(pattern)
                base = base.where(cond)
                count_sql = count_sql.where(cond)

            total_result = await session.execute(count_sql)
            total = int(total_result.scalar_one())

            stmt = base.order_by(col(City.name).asc()).offset((page - 1) * limit).limit(limit)
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def get_by_id(self, city_id: int) -> City | None:
        async with self._session() as session:
            return await session.get(City, city_id)

    async def map_by_ids(self, city_ids: set[int]) -> dict[int, City]:
        if not city_ids:
            return {}

        unique = list(city_ids)

        async with self._session() as session:
            stmt = select(City).where(col(City.id).in_(unique))
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return {c.id: c for c in rows}

    async def create(self, name: str) -> City:
        city = City(name=name)

        async with self._session() as session:
            session.add(city)
            await session.commit()
            await session.refresh(city)

            return city

    async def update(self, city_id: int, *, name: str) -> City | None:
        async with self._session() as session:
            city = await session.get(City, city_id)

            if city is None:
                return None

            city.name = name
            session.add(city)
            await session.commit()
            await session.refresh(city)

            return city

    async def delete(self, city_id: int) -> bool:
        async with self._session() as session:
            city = await session.get(City, city_id)

            if city is None:
                return False

            await session.delete(city)
            await session.commit()

            return True
