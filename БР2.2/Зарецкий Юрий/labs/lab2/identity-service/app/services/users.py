import structlog

from app.db.users import UsersRepo
from app.events.consts import IDENTITY_USER_EVENTS_TOPIC, USER_UPDATED_EVENT
from app.events.producer import EventProducer
from app.events.schemas import UserUpdatedPayload
from app.schemas.requests import ChangePasswordRequest, UpdateProfileRequest
from app.schemas.responses import UserInternalResponse, UserPublicResponse, UserResponse
from app.services.auth import AuthService
from app.services.errors import PasswordMismatchError, UserNotFoundError

logger = structlog.get_logger()


class UsersService:
    def __init__(
        self,
        users_repo: UsersRepo,
        auth_service: AuthService,
        event_producer: EventProducer,
    ) -> None:
        self._users_repo = users_repo
        self._auth_service = auth_service
        self._event_producer = event_producer

    async def get_me(self, user_id: int) -> UserResponse:
        user = await self._users_repo.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError

        return UserResponse.model_validate(user)

    async def update_me(self, user_id: int, data: UpdateProfileRequest) -> UserResponse:
        if data.full_name is None and data.phone is None and data.avatar_url is None:
            return await self.get_me(user_id)

        user = await self._users_repo.update(
            user_id,
            full_name=data.full_name,
            phone=data.phone,
            avatar_url=data.avatar_url,
        )

        if user is None:
            raise UserNotFoundError

        logger.info("Обновлён профиль пользователя", user_id=user_id)

        await self._event_producer.send(
            topic=IDENTITY_USER_EVENTS_TOPIC,
            event_type=USER_UPDATED_EVENT,
            payload=UserUpdatedPayload.from_user(user).model_dump(),
        )

        return UserResponse.model_validate(user)

    async def change_password(self, user_id: int, data: ChangePasswordRequest) -> None:
        user = await self._users_repo.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError

        if not self._auth_service.verify_password(data.old_password, user.password_hash):
            logger.info("Неверный текущий пароль при смене", user_id=user_id)

            raise PasswordMismatchError

        new_hash = self._auth_service.hash_password(data.new_password)
        updated = await self._users_repo.update(user_id, password_hash=new_hash)

        if updated is None:
            raise UserNotFoundError

        logger.info("Пароль пользователя изменён", user_id=user_id)

    async def get_public(self, user_id: int) -> UserPublicResponse:
        user = await self._users_repo.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError

        return UserPublicResponse.model_validate(user)

    async def get_internal(self, user_id: int) -> UserInternalResponse:
        user = await self._users_repo.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError

        return UserInternalResponse.model_validate(user)

    async def batch_exists(self, user_ids: list[int]) -> dict[int, bool]:
        found = await self._users_repo.ids_that_exist(user_ids)
        unique_ids = list(dict.fromkeys(user_ids))

        return {uid: (uid in found) for uid in unique_ids}
