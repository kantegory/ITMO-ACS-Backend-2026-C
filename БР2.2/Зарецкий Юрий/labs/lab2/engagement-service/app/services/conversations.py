import structlog

from app.clients.identity import IdentityClient
from app.clients.property import PropertyClient
from app.db.conversations import Conversation, ConversationsRepo
from app.db.messages import Message, MessagesRepo
from app.schemas.dto import ConversationCreateDTO, require_conversation_timestamps, require_message_timestamp
from app.schemas.requests import CreateConversationRequest
from app.schemas.responses import ConversationListResponse, ConversationResponse, MessageResponse, pagination_meta
from app.services.errors import (
    ConversationAccessDeniedError,
    ConversationNotFoundError,
    SelfConversationError,
)

logger = structlog.get_logger()


class ConversationsService:
    def __init__(
        self,
        conversations_repo: ConversationsRepo,
        messages_repo: MessagesRepo,
        identity_client: IdentityClient,
        property_client: PropertyClient,
    ) -> None:
        self._conversations_repo = conversations_repo
        self._messages_repo = messages_repo
        self._identity_client = identity_client
        self._property_client = property_client

    def _ensure_participant(self, conversation: Conversation, user_id: int) -> None:
        if user_id not in (conversation.user1_id, conversation.user2_id):
            raise ConversationAccessDeniedError

    def _to_message_response(self, message: Message) -> MessageResponse:
        created_at = require_message_timestamp(message.created_at)

        return MessageResponse(
            id=message.id,
            text=message.text,
            is_read=message.is_read,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            created_at=created_at,
        )

    def _to_conversation_response(
        self,
        row: Conversation,
        *,
        last_message: Message | None,
    ) -> ConversationResponse:
        created_at, updated_at = require_conversation_timestamps(row.created_at, row.updated_at)
        last_resp = self._to_message_response(last_message) if last_message is not None else None

        return ConversationResponse(
            id=row.id,
            user1_id=row.user1_id,
            user2_id=row.user2_id,
            property_id=row.property_id,
            created_at=created_at,
            updated_at=updated_at,
            last_message=last_resp,
        )

    async def create(self, user_id: int, body: CreateConversationRequest) -> ConversationResponse:
        if user_id == body.user_id:
            raise SelfConversationError

        await self._property_client.ensure_property_exists(body.property_id)
        await self._identity_client.ensure_user_exists(body.user_id)
        existing = await self._conversations_repo.find_existing(user_id, body.user_id, body.property_id)

        if existing is not None:
            last_map = await self._messages_repo.latest_by_conversation_ids([existing.id])
            last = last_map.get(existing.id)

            return self._to_conversation_response(existing, last_message=last)

        created = await self._conversations_repo.create(
            ConversationCreateDTO(
                user1_id=user_id,
                user2_id=body.user_id,
                property_id=body.property_id,
            ),
        )

        logger.info(
            "Создана переписка",
            conversation_id=created.id,
            user_id=user_id,
            peer_id=body.user_id,
            property_id=body.property_id,
        )

        return self._to_conversation_response(created, last_message=None)

    async def list_for_user(self, user_id: int, *, page: int, limit: int) -> ConversationListResponse:
        rows, total = await self._conversations_repo.list_by_user(user_id, page=page, limit=limit)
        ids = [r.id for r in rows]
        last_map = await self._messages_repo.latest_by_conversation_ids(ids)
        items = [self._to_conversation_response(r, last_message=last_map.get(r.id)) for r in rows]

        return ConversationListResponse(
            data=items,
            pagination=pagination_meta(page=page, limit=limit, total=total),
        )

    async def get_by_id(self, user_id: int, conversation_id: int) -> ConversationResponse:
        row = await self._conversations_repo.get_by_id(conversation_id)

        if row is None:
            raise ConversationNotFoundError

        self._ensure_participant(row, user_id)
        last_map = await self._messages_repo.latest_by_conversation_ids([row.id])
        last = last_map.get(row.id)

        return self._to_conversation_response(row, last_message=last)

    async def delete(self, user_id: int, conversation_id: int) -> None:
        row = await self._conversations_repo.get_by_id(conversation_id)

        if row is None:
            raise ConversationNotFoundError

        self._ensure_participant(row, user_id)
        await self._conversations_repo.delete(conversation_id)

        logger.info("Удалена переписка", conversation_id=conversation_id, user_id=user_id)

    async def get_unread_count(self, user_id: int) -> int:
        return await self._messages_repo.count_unread_for_user(user_id)
