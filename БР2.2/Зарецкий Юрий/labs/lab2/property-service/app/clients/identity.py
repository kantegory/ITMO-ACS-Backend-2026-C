import httpx
from pydantic import BaseModel, ConfigDict, EmailStr
from starlette.status import HTTP_404_NOT_FOUND

from app.services.errors import ExternalServiceError, UserNotFoundError
from app.settings import Settings


class IdentityUserInternalPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    email: EmailStr
    full_name: str
    avatar_url: str | None = None


class IdentityClient:
    def __init__(self, http_client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = http_client
        self._settings = settings

    def _headers(self) -> dict[str, str]:
        return {"X-Service-Token": self._settings.service_auth_token.get_secret_value()}

    def _base(self) -> str:
        return self._settings.identity_service_url.rstrip("/")

    async def fetch_internal_user(self, user_id: int) -> IdentityUserInternalPayload:
        url = f"{self._base()}/internal/users/{user_id}"
        response = await self._client.get(url, headers=self._headers())

        if response.status_code == HTTP_404_NOT_FOUND:
            raise UserNotFoundError from None

        if response.is_error:
            msg = "Ошибка Identity при загрузке пользователя"

            raise ExternalServiceError(msg)

        return IdentityUserInternalPayload.model_validate(response.json())
