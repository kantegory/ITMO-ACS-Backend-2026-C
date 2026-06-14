from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.queries import PropertyCatalogQuery
from app.schemas.requests import CreatePropertyRequest, UpdatePropertyRequest
from app.schemas.responses import PropertyCatalogResponse, PropertyDetailResponse, PropertyResponse
from app.services.errors import CityNotFoundError, ComfortNotFoundError, NotOwnerError, PropertyNotFoundError
from app.services.properties import PropertiesService

router = APIRouter(prefix="/api/properties", tags=["Объявления"])


@router.get("", summary="Каталог объектов")
@inject
async def catalog(
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
    query: Annotated[PropertyCatalogQuery, Depends()],
) -> PropertyCatalogResponse:
    return await properties_service.list_catalog(query)


@router.get("/my", summary="Мои объекты")
@inject
async def my_properties(
    user_id: Annotated[int, Depends(get_current_user_id)],
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
    is_active: Annotated[bool | None, Query()] = None,
) -> list[PropertyResponse]:
    return await properties_service.list_my(user_id, is_active=is_active)


@router.get("/user/{user_id}", summary="Активные объекты пользователя")
@inject
async def user_properties(
    user_id: int,
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
) -> list[PropertyResponse]:
    return await properties_service.list_by_user(user_id)


@router.get("/{property_id}", summary="Детали объекта")
@inject
async def get_property(
    property_id: int,
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
) -> PropertyDetailResponse:
    try:
        return await properties_service.get_detail(property_id)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None


@router.post("", summary="Создать объявление", status_code=HTTP_201_CREATED)
@inject
async def create_property(
    body: CreatePropertyRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
) -> PropertyDetailResponse:
    try:
        return await properties_service.create(user_id, body)
    except CityNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Город не найден") from None
    except ComfortNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Указано несуществующее удобство") from None


@router.patch("/{property_id}", summary="Обновить объявление")
@inject
async def update_property(
    property_id: int,
    body: UpdatePropertyRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
) -> PropertyDetailResponse:
    try:
        return await properties_service.update(user_id, property_id, body)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except NotOwnerError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Доступно только владельцу") from None
    except CityNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Город не найден") from None
    except ComfortNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Указано несуществующее удобство") from None


@router.delete("/{property_id}", summary="Удалить объявление", status_code=HTTP_204_NO_CONTENT)
@inject
async def delete_property(
    property_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
) -> Response:
    try:
        await properties_service.delete(user_id, property_id)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except NotOwnerError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Доступно только владельцу") from None

    return Response(status_code=HTTP_204_NO_CONTENT)
