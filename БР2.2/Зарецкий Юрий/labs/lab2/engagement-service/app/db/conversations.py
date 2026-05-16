from datetime import datetime

from sqlalchemy import Column, DateTime, func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo
from app.schemas.dto import ConversationCreateDTO


def _normalize_user_pair(user_a: int, user_b: int) -> tuple[int, int]:
    if user_a <= user_b:
        return user_a, user_b

    return user_b, user_a


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: int = Field(primary_key=True)
    user1_id: int
    user2_id: int
    property_id: int
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )


class ConversationsRepo(BaseRepo):
    async def create(self, data: ConversationCreateDTO) -> Conversation:
        u1, u2 = _normalize_user_pair(data.user1_id, data.user2_id)
        row = Conversation(user1_id=u1, user2_id=u2, property_id=data.property_id)

        async with self._session() as session:
            session.add(row)
            await session.commit()
            await session.refresh(row)

            return row

    async def get_by_id(self, conversation_id: int) -> Conversation | None:
        async with self._session() as session:
            return await session.get(Conversation, conversation_id)

    async def find_existing(self, user_a: int, user_b: int, property_id: int) -> Conversation | None:
        u1, u2 = _normalize_user_pair(user_a, user_b)

        async with self._session() as session:
            stmt = (
                select(Conversation)
                .where(col(Conversation.user1_id) == u1)
                .where(col(Conversation.user2_id) == u2)
                .where(col(Conversation.property_id) == property_id)
            )
            result = await session.execute(stmt)

            return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: int,
        *,
        page: int,
        limit: int,
    ) -> tuple[list[Conversation], int]:
        async with self._session() as session:
            cond = (col(Conversation.user1_id) == user_id) | (col(Conversation.user2_id) == user_id)
            count_base = select(func.count()).select_from(Conversation).where(cond)
            base = select(Conversation).where(cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = (
                base.order_by(col(Conversation.updated_at).desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def delete(self, conversation_id: int) -> bool:
        async with self._session() as session:
            row = await session.get(Conversation, conversation_id)

            if row is None:
                return False

            await session.delete(row)
            await session.commit()

            return True
