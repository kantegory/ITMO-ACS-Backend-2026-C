import structlog

from app.clients.property import PropertyClient
from app.db.property_projection import PropertyProjectionRepo
from app.services.errors import PropertyUnavailableForEngagementError

logger = structlog.get_logger()


class PropertyEngagementGuard:
    def __init__(
        self,
        property_projection_repo: PropertyProjectionRepo,
        property_client: PropertyClient,
    ) -> None:
        self._property_projection_repo = property_projection_repo
        self._property_client = property_client

    async def ensure_messaging_allowed(self, property_id: int) -> None:
        row = await self._property_projection_repo.get_by_property_id(property_id)

        if row is None:
            internal = await self._property_client.fetch_internal_property(property_id)
            await self._property_projection_repo.upsert_from_event(
                property_id=internal.id,
                owner_id=internal.owner_id,
                is_active=internal.is_active,
                is_deleted=False,
            )
            row = await self._property_projection_repo.get_by_property_id(property_id)

        if row is None:
            msg = "Проекция объекта недоступна после синхронизации"

            raise RuntimeError(msg)

        if row.is_deleted or not row.is_active:
            logger.info(
                "Отклонена операция переписки: объект неактивен или удалён",
                property_id=property_id,
            )

            raise PropertyUnavailableForEngagementError
