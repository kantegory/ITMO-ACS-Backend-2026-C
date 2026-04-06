import structlog

from app.db.cities import CitiesRepo
from app.schemas.requests import CreateCityRequest, UpdateCityRequest
from app.schemas.responses import CityListResponse, CityResponse, pagination_meta
from app.services.errors import CityNotFoundError

logger = structlog.get_logger()


class CitiesService:
    def __init__(self, cities_repo: CitiesRepo) -> None:
        self._cities_repo = cities_repo

    async def list_cities(
        self,
        *,
        search: str | None,
        page: int,
        limit: int,
    ) -> CityListResponse:
        rows, total = await self._cities_repo.list_page(search=search, page=page, limit=limit)
        items = [CityResponse.model_validate(r) for r in rows]

        return CityListResponse(data=items, pagination=pagination_meta(page=page, limit=limit, total=total))

    async def get_by_id(self, city_id: int) -> CityResponse:
        city = await self._cities_repo.get_by_id(city_id)

        if city is None:
            raise CityNotFoundError

        return CityResponse.model_validate(city)

    async def create(self, data: CreateCityRequest) -> CityResponse:
        city = await self._cities_repo.create(name=data.name)
        logger.info("Создан город", city_id=city.id)

        return CityResponse.model_validate(city)

    async def update(self, city_id: int, data: UpdateCityRequest) -> CityResponse:
        city = await self._cities_repo.update(city_id, name=data.name)

        if city is None:
            raise CityNotFoundError

        logger.info("Обновлён город", city_id=city_id)

        return CityResponse.model_validate(city)

    async def delete(self, city_id: int) -> None:
        deleted = await self._cities_repo.delete(city_id)

        if not deleted:
            raise CityNotFoundError

        logger.info("Удалён город", city_id=city_id)
