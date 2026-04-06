import structlog

from app.db.conversations import Conversation, ConversationsRepo
from app.db.messages import Message, MessagesRepo
from app.schemas.dto import MessageCreateDTO, require_message_timestamp
from app.schemas.requests import SendMessageRequest
from app.schemas.responses import MessageListResponse, MessageResponse, pagination_meta
from app.services.errors import ConversationAccessDeniedError, ConversationNotFoundError

logger = structlog.get_logger()


class MessagesService:
    def __init__(
        self,
        messages_repo: MessagesRepo,
        conversations_repo: ConversationsRepo,
    ) -> None:
        self._messages_repo = messages_repo
        self._conversations_repo = conversations_repo

    def _ensure_participant(self, conversation: Conversation, user_id: int) -> None:
        if user_id not in (conversation.user1_id, conversation.user2_id):
            raise ConversationAccessDeniedError

    def _to_response(self, row: Message) -> MessageResponse:
        created_at = require_message_timestamp(row.created_at)

        return MessageResponse(
            id=row.id,
            text=row.text,
            is_read=row.is_read,
            conversation_id=row.conversation_id,
            sender_id=row.sender_id,
            created_at=created_at,
        )

    async def send(self, user_id: int, conversation_id: int, body: SendMessageRequest) -> MessageResponse:
        conv = await self._conversations_repo.get_by_id(conversation_id)

        if conv is None:
            raise ConversationNotFoundError

        self._ensure_participant(conv, user_id)

        row = await self._messages_repo.create(
            MessageCreateDTO(
                text=body.text,
                conversation_id=conversation_id,
                sender_id=user_id,
            ),
        )

        logger.info(
            "Отправлено сообщение",
            message_id=row.id,
            conversation_id=conversation_id,
            sender_id=user_id,
        )

        return self._to_response(row)

    async def list_for_conversation(
        self,
        user_id: int,
        conversation_id: int,
        *,
        page: int,
        limit: int,
    ) -> MessageListResponse:
        conv = await self._conversations_repo.get_by_id(conversation_id)

        if conv is None:
            raise ConversationNotFoundError

        self._ensure_participant(conv, user_id)
        rows, total = await self._messages_repo.list_by_conversation(conversation_id, page=page, limit=limit)

        return MessageListResponse(
            data=[self._to_response(r) for r in rows],
            pagination=pagination_meta(page=page, limit=limit, total=total),
        )

    async def mark_read(self, user_id: int, conversation_id: int) -> int:
        conv = await self._conversations_repo.get_by_id(conversation_id)

        if conv is None:
            raise ConversationNotFoundError

        self._ensure_participant(conv, user_id)
        count = await self._messages_repo.mark_read_for_recipient(conversation_id, user_id)

        if count:
            logger.info(
                "Сообщения помечены прочитанными",
                conversation_id=conversation_id,
                user_id=user_id,
                count=count,
            )

        return count
