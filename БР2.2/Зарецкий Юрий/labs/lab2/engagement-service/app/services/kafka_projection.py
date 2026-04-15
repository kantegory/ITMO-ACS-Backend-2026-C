import structlog

from app.db.deal_projection import DealProjectionRepo
from app.db.property_projection import PropertyProjectionRepo
from app.events.schemas import (
    DealCreatedPayload,
    DealStatusChangedPayload,
    PropertyCreatedPayload,
    PropertyDeletedPayload,
    PropertyUpdatedPayload,
)

logger = structlog.get_logger()


class EngagementKafkaProjectionService:
    def __init__(
        self,
        property_projection_repo: PropertyProjectionRepo,
        deal_projection_repo: DealProjectionRepo,
    ) -> None:
        self._property_projection_repo = property_projection_repo
        self._deal_projection_repo = deal_projection_repo

    async def apply_property_created(self, payload: PropertyCreatedPayload) -> None:
        await self._property_projection_repo.upsert_from_event(
            property_id=payload.property_id,
            owner_id=payload.owner_id,
            is_active=payload.is_active,
            is_deleted=False,
        )

        logger.info(
            "Синхронизирована проекция объекта (создание)",
            property_id=payload.property_id,
        )

    async def apply_property_updated(self, payload: PropertyUpdatedPayload) -> None:
        await self._property_projection_repo.upsert_from_event(
            property_id=payload.property_id,
            owner_id=payload.owner_id,
            is_active=payload.is_active,
            is_deleted=False,
        )

        logger.info(
            "Синхронизирована проекция объекта (обновление)",
            property_id=payload.property_id,
        )

    async def apply_property_deleted(self, payload: PropertyDeletedPayload) -> None:
        await self._property_projection_repo.upsert_from_event(
            property_id=payload.property_id,
            owner_id=payload.owner_id,
            is_active=False,
            is_deleted=True,
        )

        logger.info(
            "Синхронизирована проекция объекта (удаление)",
            property_id=payload.property_id,
        )

    async def apply_deal_created(self, payload: DealCreatedPayload) -> None:
        await self._deal_projection_repo.upsert_from_event(
            deal_id=payload.deal_id,
            property_id=payload.property_id,
            tenant_id=payload.tenant_id,
            owner_id=payload.owner_id,
            status=payload.status,
        )

        logger.info(
            "Синхронизирована проекция сделки (создание)",
            deal_id=payload.deal_id,
        )

    async def apply_deal_status_changed(self, payload: DealStatusChangedPayload) -> None:
        await self._deal_projection_repo.upsert_from_event(
            deal_id=payload.deal_id,
            property_id=payload.property_id,
            tenant_id=payload.tenant_id,
            owner_id=payload.owner_id,
            status=payload.status,
        )

        logger.info(
            "Синхронизирована проекция сделки (статус)",
            deal_id=payload.deal_id,
            status=payload.status,
        )
