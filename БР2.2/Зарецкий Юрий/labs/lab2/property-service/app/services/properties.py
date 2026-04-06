import structlog

from app.db.cities import CitiesRepo
from app.db.comforts import ComfortsRepo
from app.db.photos import PhotosRepo, PropertyPhoto
from app.db.properties import PropertiesRepo, Property
from app.enums import PropertyType
from app.schemas.dto import require_property_timestamps
from app.schemas.queries import PropertyCatalogQuery
from app.schemas.requests import CreatePropertyRequest, UpdatePropertyRequest
from app.schemas.responses import (
    CityResponse,
    ComfortResponse,
    PhotoResponse,
    PropertyCatalogResponse,
    PropertyDetailResponse,
    PropertyInternalResponse,
    PropertyResponse,
    pagination_meta,
)
from app.services.errors import (
    CityNotFoundError,
    ComfortNotFoundError,
    NotOwnerError,
    PropertyNotFoundError,
)

logger = structlog.get_logger()


class PropertiesService:
    def __init__(
        self,
        properties_repo: PropertiesRepo,
        cities_repo: CitiesRepo,
        comforts_repo: ComfortsRepo,
        photos_repo: PhotosRepo,
    ) -> None:
        self._properties_repo = properties_repo
        self._cities_repo = cities_repo
        self._comforts_repo = comforts_repo
        self._photos_repo = photos_repo

    def _to_response(
        self,
        prop: Property,
        *,
        city: CityResponse | None,
        photos: list[PropertyPhoto],
    ) -> PropertyResponse:
        created_at, updated_at = require_property_timestamps(prop.created_at, prop.updated_at)

        return PropertyResponse(
            id=prop.id,
            title=prop.title,
            description=prop.description,
            type=PropertyType(prop.type),
            price_per_day=prop.price_per_day,
            address=prop.address,
            rooms_count=prop.rooms_count,
            area=prop.area,
            max_guests=prop.max_guests,
            is_active=prop.is_active,
            owner_id=prop.owner_id,
            city_id=prop.city_id,
            created_at=created_at,
            updated_at=updated_at,
            city=city,
            photos=[PhotoResponse.model_validate(p) for p in photos],
        )

    async def _ensure_city(self, city_id: int) -> None:
        city = await self._cities_repo.get_by_id(city_id)

        if city is None:
            raise CityNotFoundError

    async def _ensure_comfort_ids(self, comfort_ids: list[int]) -> None:
        if not comfort_ids:
            return

        unique = list(dict.fromkeys(comfort_ids))
        found = await self._comforts_repo.get_by_ids(unique)

        if len(found) != len(unique):
            raise ComfortNotFoundError

    async def list_catalog(self, query: PropertyCatalogQuery) -> PropertyCatalogResponse:
        params = query.to_list_params()
        rows, total = await self._properties_repo.list_catalog(params)

        city_map = await self._cities_repo.map_by_ids({p.city_id for p in rows})
        photos_map = await self._photos_repo.list_by_property_ids([p.id for p in rows])
        items: list[PropertyResponse] = []

        for prop in rows:
            c = city_map.get(prop.city_id)
            city_resp = CityResponse.model_validate(c) if c is not None else None
            ph = photos_map.get(prop.id, [])
            items.append(self._to_response(prop, city=city_resp, photos=ph))

        return PropertyCatalogResponse(
            data=items,
            pagination=pagination_meta(page=params.page, limit=params.limit, total=total),
        )

    async def list_my(self, owner_id: int, *, is_active: bool | None) -> list[PropertyResponse]:
        rows = await self._properties_repo.list_by_owner(owner_id, is_active=is_active)
        city_map = await self._cities_repo.map_by_ids({p.city_id for p in rows})
        photos_map = await self._photos_repo.list_by_property_ids([p.id for p in rows])
        items: list[PropertyResponse] = []

        for prop in rows:
            c = city_map.get(prop.city_id)
            city_resp = CityResponse.model_validate(c) if c is not None else None
            ph = photos_map.get(prop.id, [])

            items.append(self._to_response(prop, city=city_resp, photos=ph))

        return items

    async def list_by_user(self, user_id: int) -> list[PropertyResponse]:
        rows = await self._properties_repo.list_active_by_user(user_id)
        city_map = await self._cities_repo.map_by_ids({p.city_id for p in rows})
        photos_map = await self._photos_repo.list_by_property_ids([p.id for p in rows])
        items: list[PropertyResponse] = []

        for prop in rows:
            c = city_map.get(prop.city_id)
            city_resp = CityResponse.model_validate(c) if c is not None else None
            ph = photos_map.get(prop.id, [])

            items.append(self._to_response(prop, city=city_resp, photos=ph))

        return items

    async def get_detail(self, property_id: int) -> PropertyDetailResponse:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        city = await self._cities_repo.get_by_id(prop.city_id)
        city_resp = CityResponse.model_validate(city) if city is not None else None
        photos = await self._photos_repo.list_by_property(prop.id)
        comfort_ids = await self._properties_repo.get_comfort_ids(prop.id)
        comforts = await self._comforts_repo.get_by_ids(comfort_ids)
        base = self._to_response(prop, city=city_resp, photos=photos)
        payload = base.model_dump()
        payload["comforts"] = [ComfortResponse.model_validate(x).model_dump() for x in comforts]

        return PropertyDetailResponse.model_validate(payload)

    async def create(self, owner_id: int, data: CreatePropertyRequest) -> PropertyDetailResponse:
        await self._ensure_city(data.city_id)
        await self._ensure_comfort_ids(data.comfort_ids)

        prop = await self._properties_repo.create(data.to_create_dto(owner_id))

        logger.info("Создан объект", property_id=prop.id, owner_id=owner_id)

        return await self.get_detail(prop.id)

    async def update(self, user_id: int, property_id: int, data: UpdatePropertyRequest) -> PropertyDetailResponse:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        if prop.owner_id != user_id:
            raise NotOwnerError

        if data.city_id is not None:
            await self._ensure_city(data.city_id)

        if data.comfort_ids is not None:
            await self._ensure_comfort_ids(data.comfort_ids)

        updated = await self._properties_repo.update(property_id, data.to_update_dto())

        if updated is None:
            raise PropertyNotFoundError

        logger.info("Обновлён объект", property_id=property_id)

        return await self.get_detail(property_id)

    async def delete(self, user_id: int, property_id: int) -> None:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        if prop.owner_id != user_id:
            raise NotOwnerError

        await self._properties_repo.delete(property_id)
        logger.info("Удалён объект", property_id=property_id)

    async def get_internal(self, property_id: int) -> PropertyInternalResponse:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        return PropertyInternalResponse.model_validate(prop)
