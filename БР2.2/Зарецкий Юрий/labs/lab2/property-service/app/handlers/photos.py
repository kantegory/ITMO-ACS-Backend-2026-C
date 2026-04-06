from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.requests import CreatePhotoRequest, UpdatePhotoRequest
from app.schemas.responses import PhotoResponse
from app.services.errors import MaxPhotosExceededError, NotOwnerError, PhotoNotFoundError, PropertyNotFoundError
from app.services.photos import PhotosService

router = APIRouter(prefix="/api/properties/{property_id}/photos", tags=["Фотографии объекта"])


@router.get("", summary="Фотографии объекта")
@inject
async def list_photos(
    property_id: int,
    photos_service: Annotated[PhotosService, Depends(Provide[Container.photos_service])],
) -> list[PhotoResponse]:
    try:
        return await photos_service.list_photos(property_id)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None


@router.post("", summary="Добавить фото", status_code=HTTP_201_CREATED)
@inject
async def add_photo(
    property_id: int,
    body: CreatePhotoRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    photos_service: Annotated[PhotosService, Depends(Provide[Container.photos_service])],
) -> PhotoResponse:
    try:
        return await photos_service.add_photo(user_id, property_id, body)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except NotOwnerError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Доступно только владельцу") from None
    except MaxPhotosExceededError:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Максимум 20 фотографий") from None


@router.patch("/{photo_id}", summary="Обновить фото")
@inject
async def update_photo(
    property_id: int,
    photo_id: int,
    body: UpdatePhotoRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    photos_service: Annotated[PhotosService, Depends(Provide[Container.photos_service])],
) -> PhotoResponse:
    try:
        return await photos_service.update_photo(user_id, property_id, photo_id, body)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except NotOwnerError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Доступно только владельцу") from None
    except PhotoNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Фото не найдено") from None


@router.delete("/{photo_id}", summary="Удалить фото", status_code=HTTP_204_NO_CONTENT)
@inject
async def delete_photo(
    property_id: int,
    photo_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    photos_service: Annotated[PhotosService, Depends(Provide[Container.photos_service])],
) -> Response:
    try:
        await photos_service.delete_photo(user_id, property_id, photo_id)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except NotOwnerError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Доступно только владельцу") from None
    except PhotoNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Фото не найдено") from None

    return Response(status_code=HTTP_204_NO_CONTENT)
