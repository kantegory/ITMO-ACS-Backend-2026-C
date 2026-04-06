import httpx
from starlette.status import HTTP_404_NOT_FOUND

from app.services.errors import ExternalServiceError, PropertyNotFoundError
from app.settings import Settings


class PropertyClient:
    def __init__(self, http_client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = http_client
        self._settings = settings

    def _headers(self) -> dict[str, str]:
        return {"X-Service-Token": self._settings.service_auth_token.get_secret_value()}

    def _base(self) -> str:
        return self._settings.property_service_url.rstrip("/")

    async def ensure_property_exists(self, property_id: int) -> None:
        url = f"{self._base()}/internal/properties/{property_id}"
        response = await self._client.get(url, headers=self._headers())

        if response.status_code == HTTP_404_NOT_FOUND:
            raise PropertyNotFoundError from None

        if response.is_error:
            msg = "Ошибка Property при проверке объекта"

            raise ExternalServiceError(msg)
