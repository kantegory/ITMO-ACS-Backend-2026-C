from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from starlette.status import HTTP_401_UNAUTHORIZED

from app.container import Container
from app.services.errors import InvalidTokenError
from app.settings import Settings

http_bearer = HTTPBearer(auto_error=False)
service_token_header = APIKeyHeader(name="X-Service-Token", auto_error=False)


def _decode_access_token(token: str, settings: Settings) -> int:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    except JWTError:
        raise InvalidTokenError from None

    if payload.get("type") != "access":
        raise InvalidTokenError

    sub = payload.get("sub")

    if sub is None:
        raise InvalidTokenError

    return int(sub)


@inject
async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(http_bearer)],
    settings: Annotated[Settings, Depends(Provide[Container.settings])],
) -> int:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Требуется авторизация")

    try:
        return _decode_access_token(credentials.credentials, settings)
    except InvalidTokenError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Недействительный токен") from None


@inject
async def verify_service_token(
    token: Annotated[str | None, Depends(service_token_header)],
    settings: Annotated[Settings, Depends(Provide[Container.settings])],
) -> None:
    if token is None or token != settings.service_auth_token:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Недостаточно прав для сервисного доступа")
