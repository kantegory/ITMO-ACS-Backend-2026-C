from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
)

from app.container import Container
from app.schemas.requests import CreateCityRequest, UpdateCityRequest
from app.schemas.responses import CityListResponse, CityResponse
from app.services.cities import CitiesService
from app.services.errors import CityNotFoundError

router = APIRouter(prefix="/api/cities", tags=["Города"])


@router.get("", summary="Список городов")
@inject
async def list_cities(
    cities_service: Annotated[CitiesService, Depends(Provide[Container.cities_service])],
    search: Annotated[str | None, Query(description="Поиск по названию")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> CityListResponse:
    return await cities_service.list_cities(search=search, page=page, limit=limit)


@router.get("/{city_id}", summary="Город по идентификатору")
@inject
async def get_city(
    city_id: int,
    cities_service: Annotated[CitiesService, Depends(Provide[Container.cities_service])],
) -> CityResponse:
    try:
        return await cities_service.get_by_id(city_id)
    except CityNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Город не найден") from None


@router.post("", summary="Создать город", status_code=HTTP_201_CREATED)
@inject
async def create_city(
    body: CreateCityRequest,
    cities_service: Annotated[CitiesService, Depends(Provide[Container.cities_service])],
) -> CityResponse:
    return await cities_service.create(body)


@router.put("/{city_id}", summary="Обновить город")
@inject
async def update_city(
    city_id: int,
    body: UpdateCityRequest,
    cities_service: Annotated[CitiesService, Depends(Provide[Container.cities_service])],
) -> CityResponse:
    try:
        return await cities_service.update(city_id, body)
    except CityNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Город не найден") from None


@router.delete("/{city_id}", summary="Удалить город", status_code=HTTP_204_NO_CONTENT)
@inject
async def delete_city(
    city_id: int,
    cities_service: Annotated[CitiesService, Depends(Provide[Container.cities_service])],
) -> Response:
    try:
        await cities_service.delete(city_id)
    except CityNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Город не найден") from None

    return Response(status_code=HTTP_204_NO_CONTENT)
