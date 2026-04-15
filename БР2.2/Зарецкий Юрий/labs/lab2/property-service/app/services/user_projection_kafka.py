import structlog

from app.db.user_projection import UserProjectionRepo
from app.events.schemas import IdentityUserCreatedPayload, IdentityUserUpdatedPayload

logger = structlog.get_logger()


class UserProjectionKafkaService:
    def __init__(self, user_projection_repo: UserProjectionRepo) -> None:
        self._user_projection_repo = user_projection_repo

    async def apply_user_created(self, payload: IdentityUserCreatedPayload) -> None:
        await self._user_projection_repo.upsert_from_created(
            user_id=payload.user_id,
            email=payload.email,
            full_name=payload.full_name,
            phone=payload.phone,
            avatar_url=payload.avatar_url,
        )

        logger.info(
            "Обновлена проекция пользователя по событию создания",
            user_id=payload.user_id,
        )

    async def apply_user_updated(self, payload: IdentityUserUpdatedPayload) -> None:
        await self._user_projection_repo.upsert_from_updated(
            user_id=payload.user_id,
            full_name=payload.full_name,
            phone=payload.phone,
            avatar_url=payload.avatar_url,
        )

        logger.info(
            "Обновлена проекция пользователя по событию изменения",
            user_id=payload.user_id,
        )
