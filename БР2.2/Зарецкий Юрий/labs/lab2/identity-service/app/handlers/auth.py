from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_401_UNAUTHORIZED,
    HTTP_409_CONFLICT,
)

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.requests import LoginRequest, RefreshTokenRequest, RegisterRequest
from app.schemas.responses import AuthResponse, TokensResponse
from app.services.auth import AuthService
from app.services.errors import EmailAlreadyRegisteredError, InvalidCredentialsError, InvalidTokenError

router = APIRouter(prefix="/api/auth", tags=["Аутентификация"])


@router.post("/register", summary="Регистрация пользователя", status_code=HTTP_201_CREATED)
@inject
async def register(
    body: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(Provide[Container.auth_service])],
) -> AuthResponse:
    try:
        return await auth_service.register(body)
    except EmailAlreadyRegisteredError:
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Пользователь с таким email уже существует") from None


@router.post("/login", summary="Вход в систему")
@inject
async def login(
    body: LoginRequest,
    auth_service: Annotated[AuthService, Depends(Provide[Container.auth_service])],
) -> AuthResponse:
    try:
        return await auth_service.login(body)
    except InvalidCredentialsError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль") from None


@router.post("/refresh", summary="Обновление пары токенов")
@inject
async def refresh_tokens(
    body: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(Provide[Container.auth_service])],
) -> TokensResponse:
    try:
        return await auth_service.refresh(body)
    except InvalidTokenError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Недействительный refresh-токен") from None


@router.post("/logout", summary="Выход из системы", status_code=HTTP_204_NO_CONTENT)
async def logout(
    _user_id: Annotated[int, Depends(get_current_user_id)],
) -> Response:
    return Response(status_code=HTTP_204_NO_CONTENT)
