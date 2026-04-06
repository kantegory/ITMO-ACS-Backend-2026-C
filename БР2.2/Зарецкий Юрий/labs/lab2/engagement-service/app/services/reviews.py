import structlog

from app.clients.identity import IdentityClient
from app.clients.property import PropertyClient
from app.db.reviews import Review, ReviewsRepo
from app.schemas.dto import ReviewCreateDTO, ReviewUpdateDTO, require_review_timestamps
from app.schemas.requests import (
    CreatePropertyReviewRequest,
    CreateUserReviewRequest,
    UpdateReviewRequest,
)
from app.schemas.responses import ReviewListResponse, ReviewResponse, pagination_meta
from app.services.errors import (
    InvalidReviewPayloadError,
    ReviewAccessDeniedError,
    ReviewNotFoundError,
    SelfReviewError,
)

logger = structlog.get_logger()


class ReviewsService:
    def __init__(
        self,
        reviews_repo: ReviewsRepo,
        identity_client: IdentityClient,
        property_client: PropertyClient,
    ) -> None:
        self._reviews_repo = reviews_repo
        self._identity_client = identity_client
        self._property_client = property_client

    def _to_response(self, row: Review) -> ReviewResponse:
        created_at, updated_at = require_review_timestamps(row.created_at, row.updated_at)

        return ReviewResponse(
            id=row.id,
            rating=row.rating,
            comment=row.comment,
            property_id=row.property_id,
            author_id=row.author_id,
            target_user_id=row.target_user_id,
            created_at=created_at,
            updated_at=updated_at,
        )

    async def create_property_review(
        self,
        author_id: int,
        body: CreatePropertyReviewRequest,
    ) -> ReviewResponse:
        await self._property_client.ensure_property_exists(body.property_id)

        row = await self._reviews_repo.create(
            ReviewCreateDTO(
                rating=body.rating,
                comment=body.comment,
                property_id=body.property_id,
                author_id=author_id,
                target_user_id=None,
            ),
        )

        logger.info(
            "Создан отзыв на объект",
            review_id=row.id,
            property_id=body.property_id,
            author_id=author_id,
        )

        return self._to_response(row)

    async def create_user_review(
        self,
        author_id: int,
        body: CreateUserReviewRequest,
    ) -> ReviewResponse:
        if author_id == body.target_user_id:
            raise SelfReviewError

        await self._identity_client.ensure_user_exists(body.target_user_id)

        row = await self._reviews_repo.create(
            ReviewCreateDTO(
                rating=body.rating,
                comment=body.comment,
                property_id=None,
                author_id=author_id,
                target_user_id=body.target_user_id,
            ),
        )

        logger.info(
            "Создан отзыв на пользователя",
            review_id=row.id,
            target_user_id=body.target_user_id,
            author_id=author_id,
        )

        return self._to_response(row)

    async def list_by_property(
        self,
        property_id: int,
        *,
        page: int,
        limit: int,
    ) -> ReviewListResponse:
        rows, total = await self._reviews_repo.list_by_property(property_id, page=page, limit=limit)

        return ReviewListResponse(
            data=[self._to_response(r) for r in rows],
            pagination=pagination_meta(page=page, limit=limit, total=total),
        )

    async def list_by_user(
        self,
        user_id: int,
        *,
        page: int,
        limit: int,
    ) -> ReviewListResponse:
        rows, total = await self._reviews_repo.list_by_target_user(user_id, page=page, limit=limit)

        return ReviewListResponse(
            data=[self._to_response(r) for r in rows],
            pagination=pagination_meta(page=page, limit=limit, total=total),
        )

    async def list_my(
        self,
        author_id: int,
        *,
        page: int,
        limit: int,
    ) -> ReviewListResponse:
        rows, total = await self._reviews_repo.list_by_author(author_id, page=page, limit=limit)

        return ReviewListResponse(
            data=[self._to_response(r) for r in rows],
            pagination=pagination_meta(page=page, limit=limit, total=total),
        )

    async def get_by_id(self, review_id: int) -> ReviewResponse:
        row = await self._reviews_repo.get_by_id(review_id)

        if row is None:
            raise ReviewNotFoundError

        return self._to_response(row)

    async def update(self, user_id: int, review_id: int, body: UpdateReviewRequest) -> ReviewResponse:
        if body.rating is None and body.comment is None:
            raise InvalidReviewPayloadError

        row = await self._reviews_repo.get_by_id(review_id)

        if row is None:
            raise ReviewNotFoundError

        if row.author_id != user_id:
            raise ReviewAccessDeniedError

        updated = await self._reviews_repo.update(
            review_id,
            ReviewUpdateDTO(rating=body.rating, comment=body.comment),
        )

        if updated is None:
            raise ReviewNotFoundError

        logger.info("Обновлён отзыв", review_id=review_id, author_id=user_id)

        return self._to_response(updated)

    async def delete(self, user_id: int, review_id: int) -> None:
        row = await self._reviews_repo.get_by_id(review_id)

        if row is None:
            raise ReviewNotFoundError

        if row.author_id != user_id:
            raise ReviewAccessDeniedError

        await self._reviews_repo.delete(review_id)

        logger.info("Удалён отзыв", review_id=review_id, author_id=user_id)
