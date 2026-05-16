import httpx
from starlette.status import HTTP_404_NOT_FOUND

from app.services.errors import ExternalServiceError, UserNotFoundError
from app.settings import Settings


class IdentityClient:
    def __init__(self, http_client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = http_client
        self._settings = settings

    def _headers(self) -> dict[str, str]:
        return {"X-Service-Token": self._settings.service_auth_token.get_secret_value()}

    def _base(self) -> str:
        return self._settings.identity_service_url.rstrip("/")

    async def ensure_user_exists(self, user_id: int) -> None:
        url = f"{self._base()}/internal/users/{user_id}"
        response = await self._client.get(url, headers=self._headers())

        if response.status_code == HTTP_404_NOT_FOUND:
            raise UserNotFoundError from None

        if response.is_error:
            msg = "Ошибка Identity при проверке пользователя"

            raise ExternalServiceError(msg)

    async def users_exist(self, user_ids: list[int]) -> set[int]:
        if not user_ids:
            return set()

        unique = list(dict.fromkeys(user_ids))
        url = f"{self._base()}/internal/users/exists"
        response = await self._client.get(
            url,
            headers=self._headers(),
            params=[("ids", uid) for uid in unique],
        )

        if response.is_error:
            msg = "Ошибка Identity при пакетной проверке пользователей"

            raise ExternalServiceError(msg)

        payload = response.json()
        raw_exists = payload.get("exists", {})
        result: set[int] = set()

        for key, value in raw_exists.items():
            if value:
                result.add(int(key))

        return result
