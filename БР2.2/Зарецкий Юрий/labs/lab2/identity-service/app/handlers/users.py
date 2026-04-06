from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response
from starlette.status import HTTP_204_NO_CONTENT, HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.requests import ChangePasswordRequest, UpdateProfileRequest
from app.schemas.responses import UserPublicResponse, UserResponse
from app.services.errors import PasswordMismatchError, UserNotFoundError
from app.services.users import UsersService

router = APIRouter(prefix="/api/users", tags=["Пользователи"])


@router.get("/me", summary="Текущий профиль")
@inject
async def get_me(
    user_id: Annotated[int, Depends(get_current_user_id)],
    users_service: Annotated[UsersService, Depends(Provide[Container.users_service])],
) -> UserResponse:
    try:
        return await users_service.get_me(user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None


@router.patch("/me", summary="Обновление профиля")
@inject
async def update_me(
    body: UpdateProfileRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    users_service: Annotated[UsersService, Depends(Provide[Container.users_service])],
) -> UserResponse:
    try:
        return await users_service.update_me(user_id, body)
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None


@router.put("/me/password", summary="Смена пароля", status_code=HTTP_204_NO_CONTENT)
@inject
async def change_password(
    body: ChangePasswordRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    users_service: Annotated[UsersService, Depends(Provide[Container.users_service])],
) -> Response:
    try:
        await users_service.change_password(user_id, body)
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None
    except PasswordMismatchError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Неверный текущий пароль") from None

    return Response(status_code=HTTP_204_NO_CONTENT)


@router.get("/{user_id}", summary="Публичный профиль пользователя")
@inject
async def get_public_profile(
    user_id: int,
    users_service: Annotated[UsersService, Depends(Provide[Container.users_service])],
) -> UserPublicResponse:
    try:
        return await users_service.get_public(user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None
