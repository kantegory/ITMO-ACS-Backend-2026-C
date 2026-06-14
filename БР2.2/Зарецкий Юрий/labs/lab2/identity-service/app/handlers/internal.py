from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Query
from starlette.status import HTTP_404_NOT_FOUND

from app.container import Container
from app.handlers.deps import verify_service_token
from app.schemas.responses import BatchUserExistsResponse, UserInternalResponse
from app.services.errors import UserNotFoundError
from app.services.users import UsersService

router = APIRouter(prefix="/internal/users", tags=["Внутренний API"])


@router.get(
    "/exists",
    summary="Проверка существования пользователей по идентификаторам",
    dependencies=[Depends(verify_service_token)],
)
@inject
async def batch_user_exists(
    ids: Annotated[list[int], Query(default_factory=list)],
    users_service: Annotated[UsersService, Depends(Provide[Container.users_service])],
) -> BatchUserExistsResponse:
    exists = await users_service.batch_exists(ids)

    return BatchUserExistsResponse(exists=exists)


@router.get(
    "/{user_id}",
    summary="Минимальный профиль пользователя для межсервисных запросов",
    dependencies=[Depends(verify_service_token)],
)
@inject
async def get_internal_user(
    user_id: int,
    users_service: Annotated[UsersService, Depends(Provide[Container.users_service])],
) -> UserInternalResponse:
    try:
        return await users_service.get_internal(user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None
