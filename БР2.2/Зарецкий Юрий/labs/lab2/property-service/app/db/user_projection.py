from datetime import datetime

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, SQLModel

from app.db.base import BaseRepo


class UserProjection(SQLModel, table=True):
    __tablename__ = "user_projections"

    user_id: int = Field(primary_key=True)
    email: str
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )


class UserProjectionRepo(BaseRepo):
    async def exists(self, user_id: int) -> bool:
        async with self._session() as session:
            row = await session.get(UserProjection, user_id)

            return row is not None

    async def upsert_from_created(
        self,
        *,
        user_id: int,
        email: str,
        full_name: str,
        phone: str | None,
        avatar_url: str | None,
    ) -> None:
        async with self._session() as session:
            row = await session.get(UserProjection, user_id)

            if row is None:
                row = UserProjection(
                    user_id=user_id,
                    email=email,
                    full_name=full_name,
                    phone=phone,
                    avatar_url=avatar_url,
                )
                session.add(row)
            else:
                row.email = email
                row.full_name = full_name
                row.phone = phone
                row.avatar_url = avatar_url

    async def upsert_from_updated(
        self,
        *,
        user_id: int,
        full_name: str,
        phone: str | None,
        avatar_url: str | None,
    ) -> None:
        async with self._session() as session:
            row = await session.get(UserProjection, user_id)

            if row is None:
                return

            row.full_name = full_name
            row.phone = phone
            row.avatar_url = avatar_url

    async def upsert_from_internal(
        self,
        *,
        user_id: int,
        email: str,
        full_name: str,
        avatar_url: str | None,
    ) -> None:
        async with self._session() as session:
            row = await session.get(UserProjection, user_id)

            if row is None:
                row = UserProjection(
                    user_id=user_id,
                    email=email,
                    full_name=full_name,
                    phone=None,
                    avatar_url=avatar_url,
                )
                session.add(row)
            else:
                row.email = email
                row.full_name = full_name
                row.avatar_url = avatar_url
