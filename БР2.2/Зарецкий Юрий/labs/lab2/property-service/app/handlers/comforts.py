from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
)

from app.container import Container
from app.schemas.requests import CreateComfortRequest, UpdateComfortRequest
from app.schemas.responses import ComfortResponse
from app.services.comforts import ComfortsService
from app.services.errors import ComfortNotFoundError

router = APIRouter(prefix="/api/comforts", tags=["Удобства"])


@router.get("", summary="Все удобства")
@inject
async def list_comforts(
    comforts_service: Annotated[ComfortsService, Depends(Provide[Container.comforts_service])],
) -> list[ComfortResponse]:
    return await comforts_service.list_all()


@router.get("/{comfort_id}", summary="Удобство по идентификатору")
@inject
async def get_comfort(
    comfort_id: int,
    comforts_service: Annotated[ComfortsService, Depends(Provide[Container.comforts_service])],
) -> ComfortResponse:
    try:
        return await comforts_service.get_by_id(comfort_id)
    except ComfortNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Удобство не найдено") from None


@router.post("", summary="Создать удобство", status_code=HTTP_201_CREATED)
@inject
async def create_comfort(
    body: CreateComfortRequest,
    comforts_service: Annotated[ComfortsService, Depends(Provide[Container.comforts_service])],
) -> ComfortResponse:
    return await comforts_service.create(body)


@router.put("/{comfort_id}", summary="Обновить удобство")
@inject
async def update_comfort(
    comfort_id: int,
    body: UpdateComfortRequest,
    comforts_service: Annotated[ComfortsService, Depends(Provide[Container.comforts_service])],
) -> ComfortResponse:
    try:
        return await comforts_service.update(comfort_id, body)
    except ComfortNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Удобство не найдено") from None


@router.delete("/{comfort_id}", summary="Удалить удобство", status_code=HTTP_204_NO_CONTENT)
@inject
async def delete_comfort(
    comfort_id: int,
    comforts_service: Annotated[ComfortsService, Depends(Provide[Container.comforts_service])],
) -> Response:
    try:
        await comforts_service.delete(comfort_id)
    except ComfortNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Удобство не найдено") from None

    return Response(status_code=HTTP_204_NO_CONTENT)
