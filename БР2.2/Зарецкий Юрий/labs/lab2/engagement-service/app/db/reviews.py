from datetime import datetime

from sqlalchemy import Column, DateTime, Text, func, select
from sqlmodel import Field, SQLModel, col

from app.db.base import BaseRepo
from app.schemas.dto import ReviewCreateDTO, ReviewUpdateDTO


class Review(SQLModel, table=True):
    __tablename__ = "reviews"

    id: int = Field(primary_key=True)
    rating: int
    comment: str = Field(sa_column=Column(Text, nullable=False))
    property_id: int | None = None
    author_id: int
    target_user_id: int | None = None
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


class ReviewsRepo(BaseRepo):
    async def create(self, data: ReviewCreateDTO) -> Review:
        row = Review(
            rating=data.rating,
            comment=data.comment,
            property_id=data.property_id,
            author_id=data.author_id,
            target_user_id=data.target_user_id,
        )

        async with self._session() as session:
            session.add(row)
            await session.commit()
            await session.refresh(row)

            return row

    async def get_by_id(self, review_id: int) -> Review | None:
        async with self._session() as session:
            return await session.get(Review, review_id)

    async def list_by_property(
        self,
        property_id: int,
        *,
        page: int,
        limit: int,
    ) -> tuple[list[Review], int]:
        async with self._session() as session:
            cond = col(Review.property_id) == property_id
            count_base = select(func.count()).select_from(Review).where(cond)
            base = select(Review).where(cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = (
                base.order_by(col(Review.created_at).desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def list_by_target_user(
        self,
        user_id: int,
        *,
        page: int,
        limit: int,
    ) -> tuple[list[Review], int]:
        async with self._session() as session:
            cond = col(Review.target_user_id) == user_id
            count_base = select(func.count()).select_from(Review).where(cond)
            base = select(Review).where(cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = (
                base.order_by(col(Review.created_at).desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def list_by_author(
        self,
        author_id: int,
        *,
        page: int,
        limit: int,
    ) -> tuple[list[Review], int]:
        async with self._session() as session:
            cond = col(Review.author_id) == author_id
            count_base = select(func.count()).select_from(Review).where(cond)
            base = select(Review).where(cond)

            total_result = await session.execute(count_base)
            total = int(total_result.scalar_one())

            stmt = (
                base.order_by(col(Review.created_at).desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
            result = await session.execute(stmt)
            rows = list(result.scalars().all())

            return rows, total

    async def update(self, review_id: int, data: ReviewUpdateDTO) -> Review | None:
        async with self._session() as session:
            row = await session.get(Review, review_id)

            if row is None:
                return None

            if data.rating is not None:
                row.rating = data.rating

            if data.comment is not None:
                row.comment = data.comment

            session.add(row)
            await session.commit()
            await session.refresh(row)

            return row

    async def delete(self, review_id: int) -> bool:
        async with self._session() as session:
            row = await session.get(Review, review_id)

            if row is None:
                return False

            await session.delete(row)
            await session.commit()

            return True
