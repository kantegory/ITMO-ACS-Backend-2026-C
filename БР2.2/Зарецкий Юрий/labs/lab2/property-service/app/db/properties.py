from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Text, delete, func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo
from app.schemas.dto import PropertyCatalogListParams, PropertyCreateDTO, PropertyUpdateDTO


class PropertyComfort(SQLModel, table=True):
    __tablename__ = "property_comforts"

    property_id: int = Field(foreign_key="properties.id", primary_key=True)
    comfort_id: int = Field(foreign_key="comforts.id", primary_key=True)


class Property(SQLModel, table=True):
    __tablename__ = "properties"

    id: int = Field(primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(sa_column=Column(Text, nullable=False))
    type: str = Field(max_length=20)
    price_per_day: float
    address: str = Field(max_length=500)
    rooms_count: int | None = None
    area: float | None = None
    max_guests: int | None = None
    is_active: bool = Field(default=True)
    owner_id: int
    city_id: int = Field(foreign_key="cities.id")
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


class PropertiesRepo(BaseRepo):
    _SORTABLE = frozenset({"created_at", "price_per_day", "area", "rooms_count"})

    def _catalog_filter_conditions(self, params: PropertyCatalogListParams) -> list[Any]:
        flt = params.filters
        conds: list[Any] = []

        if flt.only_active:
            conds.append(col(Property.is_active).is_(True))

        if flt.search:
            pattern = f"%{flt.search}%"
            title_m = col(Property.title).ilike(pattern)
            desc_m = col(Property.description).ilike(pattern)
            conds.append(title_m | desc_m)

        if flt.city_id is not None:
            conds.append(col(Property.city_id) == flt.city_id)

        if flt.property_type is not None:
            conds.append(col(Property.type) == flt.property_type)

        if flt.price_min is not None:
            conds.append(col(Property.price_per_day) >= flt.price_min)

        if flt.price_max is not None:
            conds.append(col(Property.price_per_day) <= flt.price_max)

        if flt.rooms_min is not None:
            conds.append(col(Property.rooms_count) >= flt.rooms_min)

        if flt.rooms_max is not None:
            conds.append(col(Property.rooms_count) <= flt.rooms_max)

        if flt.guests_min is not None:
            conds.append(col(Property.max_guests) >= flt.guests_min)

        return conds

    async def list_catalog(self, params: PropertyCatalogListParams) -> tuple[list[Property], int]:
        sort_col = params.sort_by if params.sort_by in self._SORTABLE else "created_at"
        column = getattr(Property, sort_col)
        conds = self._catalog_filter_conditions(params)

        async with self._session() as session:
            count_base = select(func.count()).select_from(Property)
            base = select(Property)

            if conds:
                for c in conds:
                    count_base = count_base.where(c)
                    base = base.where(c)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            if params.sort_order.upper() == "ASC":
                base = base.order_by(column.asc())
            else:
                base = base.order_by(column.desc())

            stmt = base.offset((params.page - 1) * params.limit).limit(params.limit)
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def get_by_id(self, property_id: int) -> Property | None:
        async with self._session() as session:
            return await session.get(Property, property_id)

    async def list_by_owner(
        self,
        owner_id: int,
        *,
        is_active: bool | None,
    ) -> list[Property]:
        async with self._session() as session:
            stmt = select(Property).where(col(Property.owner_id) == owner_id)

            if is_active is not None:
                stmt = stmt.where(col(Property.is_active).is_(is_active))

            stmt = stmt.order_by(col(Property.created_at).desc())
            result = await session.execute(stmt)

            return list(result.scalars().all())

    async def list_active_by_user(self, user_id: int) -> list[Property]:
        async with self._session() as session:
            stmt = (
                select(Property)
                .where(col(Property.owner_id) == user_id)
                .where(col(Property.is_active).is_(True))
                .order_by(col(Property.created_at).desc())
            )
            result = await session.execute(stmt)

            return list(result.scalars().all())

    async def get_comfort_ids(self, property_id: int) -> list[int]:
        async with self._session() as session:
            stmt = select(col(PropertyComfort.comfort_id)).where(
                col(PropertyComfort.property_id) == property_id,
            )
            result = await session.execute(stmt)

            return [int(x) for x in result.scalars().all()]

    async def create(self, data: PropertyCreateDTO) -> Property:
        prop = Property(
            title=data.title,
            description=data.description,
            type=data.property_type,
            price_per_day=data.price_per_day,
            address=data.address,
            rooms_count=data.rooms_count,
            area=data.area,
            max_guests=data.max_guests,
            owner_id=data.owner_id,
            city_id=data.city_id,
        )
        unique_comforts = list(dict.fromkeys(data.comfort_ids))

        async with self._session() as session:
            session.add(prop)
            await session.flush()

            for cid in unique_comforts:
                session.add(PropertyComfort(property_id=prop.id, comfort_id=cid))

            await session.commit()
            await session.refresh(prop)

            return prop

    async def update(self, property_id: int, data: PropertyUpdateDTO) -> Property | None:
        async with self._session() as session:
            prop = await session.get(Property, property_id)

            if prop is None:
                return None

            if data.title is not None:
                prop.title = data.title

            if data.description is not None:
                prop.description = data.description

            if data.property_type is not None:
                prop.type = data.property_type

            if data.price_per_day is not None:
                prop.price_per_day = data.price_per_day

            if data.address is not None:
                prop.address = data.address

            if data.rooms_count is not None:
                prop.rooms_count = data.rooms_count

            if data.area is not None:
                prop.area = data.area

            if data.max_guests is not None:
                prop.max_guests = data.max_guests

            if data.is_active is not None:
                prop.is_active = data.is_active

            if data.city_id is not None:
                prop.city_id = data.city_id

            session.add(prop)
            await session.flush()

            if data.comfort_ids is not None:
                unique = list(dict.fromkeys(data.comfort_ids))
                await session.execute(
                    delete(PropertyComfort).where(col(PropertyComfort.property_id) == property_id),
                )

                for cid in unique:
                    session.add(PropertyComfort(property_id=property_id, comfort_id=cid))

            await session.commit()
            await session.refresh(prop)

            return prop

    async def delete(self, property_id: int) -> bool:
        async with self._session() as session:
            prop = await session.get(Property, property_id)

            if prop is None:
                return False

            await session.delete(prop)
            await session.commit()

            return True
