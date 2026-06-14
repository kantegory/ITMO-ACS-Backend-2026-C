from datetime import datetime

from sqlalchemy import Column, DateTime, func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int = Field(primary_key=True)
    email: str = Field(max_length=300, unique=True, index=True)
    full_name: str = Field(max_length=300)
    password_hash: str = Field(max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = Field(default=None, max_length=500)
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


class UsersRepo(BaseRepo):
    async def get_by_id(self, user_id: int) -> User | None:
        async with self._session() as session:
            return await session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        normalized = email.lower().strip()

        async with self._session() as session:
            result = await session.execute(select(User).where(col(User.email) == normalized))

            return result.scalar_one_or_none()

    async def create(
        self,
        email: str,
        full_name: str,
        password_hash: str,
        phone: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        user = User(
            email=email.lower().strip(),
            full_name=full_name,
            password_hash=password_hash,
            phone=phone,
            avatar_url=avatar_url,
        )

        async with self._session() as session:
            session.add(user)
            await session.commit()
            await session.refresh(user)

            return user

    async def update(
        self,
        user_id: int,
        *,
        full_name: str | None = None,
        phone: str | None = None,
        avatar_url: str | None = None,
        password_hash: str | None = None,
    ) -> User | None:
        async with self._session() as session:
            user = await session.get(User, user_id)

            if user is None:
                return None

            if full_name is not None:
                user.full_name = full_name

            if phone is not None:
                user.phone = phone

            if avatar_url is not None:
                user.avatar_url = avatar_url

            if password_hash is not None:
                user.password_hash = password_hash

            session.add(user)
            await session.commit()
            await session.refresh(user)

            return user

    async def ids_that_exist(self, user_ids: list[int]) -> set[int]:
        if not user_ids:
            return set()

        unique_ids = list(dict.fromkeys(user_ids))

        async with self._session() as session:
            stmt = select(col(User.id)).where(col(User.id).in_(unique_ids))
            result = await session.execute(stmt)

            return {int(rid) for rid in result.scalars().all() if rid is not None}
