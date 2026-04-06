from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from starlette.status import HTTP_401_UNAUTHORIZED

from app.container import Container
from app.services.auth import AuthService
from app.services.errors import InvalidTokenError
from app.settings import Settings

http_bearer = HTTPBearer(auto_error=False)
service_token_header = APIKeyHeader(name="X-Service-Token", auto_error=False)


@inject
async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(http_bearer)],
    auth_service: Annotated[AuthService, Depends(Provide[Container.auth_service])],
) -> int:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Требуется авторизация")

    try:
        return auth_service.validate_access_token(credentials.credentials)
    except InvalidTokenError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Недействительный токен") from None


@inject
async def verify_service_token(
    token: Annotated[str | None, Depends(service_token_header)],
    settings: Annotated[Settings, Depends(Provide[Container.settings])],
) -> None:
    if token is None or token != settings.service_auth_token:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Недостаточно прав для сервисного доступа")
