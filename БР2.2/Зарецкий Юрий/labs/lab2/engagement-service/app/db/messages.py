from datetime import datetime

from sqlalchemy import Column, DateTime, Text, func, select, update
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo
from app.db.conversations import Conversation
from app.schemas.dto import MessageCreateDTO


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: int = Field(primary_key=True)
    text: str = Field(sa_column=Column(Text, nullable=False))
    is_read: bool = Field(default=False)
    conversation_id: int = Field(foreign_key="conversations.id")
    sender_id: int
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )


class MessagesRepo(BaseRepo):
    async def create(self, data: MessageCreateDTO) -> Message:
        row = Message(
            text=data.text,
            conversation_id=data.conversation_id,
            sender_id=data.sender_id,
        )

        async with self._session() as session:
            session.add(row)
            await session.flush()
            await session.execute(
                update(Conversation)
                .where(col(Conversation.id) == data.conversation_id)
                .values(updated_at=func.now()),
            )
            await session.commit()
            await session.refresh(row)

            return row

    async def get_by_id(self, message_id: int) -> Message | None:
        async with self._session() as session:
            return await session.get(Message, message_id)

    async def list_by_conversation(
        self,
        conversation_id: int,
        *,
        page: int,
        limit: int,
    ) -> tuple[list[Message], int]:
        async with self._session() as session:
            cond = col(Message.conversation_id) == conversation_id
            count_base = select(func.count()).select_from(Message).where(cond)
            base = select(Message).where(cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = (
                base.order_by(col(Message.created_at).asc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def mark_read_for_recipient(self, conversation_id: int, recipient_user_id: int) -> int:
        async with self._session() as session:
            stmt = (
                select(Message)
                .where(col(Message.conversation_id) == conversation_id)
                .where(col(Message.sender_id) != recipient_user_id)
                .where(col(Message.is_read).is_(False))
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            for msg in rows:
                msg.is_read = True
                session.add(msg)

            await session.commit()

            return len(rows)

    async def count_unread_for_user(self, user_id: int) -> int:
        async with self._session() as session:
            participant_cond = (col(Conversation.user1_id) == user_id) | (
                col(Conversation.user2_id) == user_id
            )
            stmt = (
                select(func.count())
                .select_from(Message)
                .join(Conversation, col(Message.conversation_id) == col(Conversation.id))
                .where(participant_cond)
                .where(col(Message.sender_id) != user_id)
                .where(col(Message.is_read).is_(False))
            )
            result = await session.execute(stmt)

            return int(result.scalar_one())

    async def latest_by_conversation_ids(self, conversation_ids: list[int]) -> dict[int, Message | None]:
        if not conversation_ids:
            return {}

        unique_ids = list(dict.fromkeys(conversation_ids))

        async with self._session() as session:
            sub = (
                select(col(Message.conversation_id), func.max(col(Message.id)).label("mid"))
                .where(col(Message.conversation_id).in_(unique_ids))
                .group_by(col(Message.conversation_id))
                .subquery()
            )
            stmt = select(Message).join(
                sub,
                (col(Message.conversation_id) == sub.c.conversation_id) & (col(Message.id) == sub.c.mid),
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            by_conv = {row.conversation_id: row for row in rows}

            return {cid: by_conv.get(cid) for cid in unique_ids}
