from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_502_BAD_GATEWAY,
)

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.queries import PaginationQuery
from app.schemas.requests import (
    CreatePropertyReviewRequest,
    CreateUserReviewRequest,
    UpdateReviewRequest,
)
from app.schemas.responses import ReviewListResponse, ReviewResponse
from app.services.errors import (
    ExternalServiceError,
    InvalidReviewPayloadError,
    PropertyNotFoundError,
    ReviewAccessDeniedError,
    ReviewNotFoundError,
    SelfReviewError,
    UserNotFoundError,
)
from app.services.reviews import ReviewsService

router = APIRouter(prefix="/api/reviews", tags=["Отзывы"])


@router.get("/my", summary="Мои отзывы")
@inject
async def my_reviews(
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
    query: Annotated[PaginationQuery, Depends()],
) -> ReviewListResponse:
    params = query.to_page_params()

    return await service.list_my(user_id, page=params.page, limit=params.limit)


@router.get("/property/{property_id}", summary="Отзывы по объекту")
@inject
async def reviews_by_property(
    property_id: int,
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
    query: Annotated[PaginationQuery, Depends()],
) -> ReviewListResponse:
    params = query.to_page_params()

    return await service.list_by_property(property_id, page=params.page, limit=params.limit)


@router.get("/user/{user_id}", summary="Отзывы о пользователе")
@inject
async def reviews_by_user(
    user_id: int,
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
    query: Annotated[PaginationQuery, Depends()],
) -> ReviewListResponse:
    params = query.to_page_params()

    return await service.list_by_user(user_id, page=params.page, limit=params.limit)


@router.get("/{review_id}", summary="Отзыв по идентификатору")
@inject
async def get_review(
    review_id: int,
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
) -> ReviewResponse:
    try:
        return await service.get_by_id(review_id)
    except ReviewNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Отзыв не найден") from None


@router.post("/property", summary="Оставить отзыв на объект", status_code=HTTP_201_CREATED)
@inject
async def create_property_review(
    body: CreatePropertyReviewRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
) -> ReviewResponse:
    try:
        return await service.create_property_review(user_id, body)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except ExternalServiceError:
        raise HTTPException(status_code=HTTP_502_BAD_GATEWAY, detail="Сервис недоступен") from None


@router.post("/user", summary="Оставить отзыв на пользователя", status_code=HTTP_201_CREATED)
@inject
async def create_user_review(
    body: CreateUserReviewRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
) -> ReviewResponse:
    try:
        return await service.create_user_review(user_id, body)
    except SelfReviewError:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Нельзя оставить отзыв самому себе",
        ) from None
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None
    except ExternalServiceError:
        raise HTTPException(status_code=HTTP_502_BAD_GATEWAY, detail="Сервис недоступен") from None


@router.patch("/{review_id}", summary="Обновить отзыв")
@inject
async def update_review(
    review_id: int,
    body: UpdateReviewRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
) -> ReviewResponse:
    try:
        return await service.update(user_id, review_id, body)
    except InvalidReviewPayloadError:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Укажите хотя бы одно поле для обновления",
        ) from None
    except ReviewNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Отзыв не найден") from None
    except ReviewAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Недостаточно прав") from None


@router.delete("/{review_id}", summary="Удалить отзыв", status_code=HTTP_204_NO_CONTENT)
@inject
async def delete_review(
    review_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ReviewsService, Depends(Provide[Container.reviews_service])],
) -> Response:
    try:
        await service.delete(user_id, review_id)
    except ReviewNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Отзыв не найден") from None
    except ReviewAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Недостаточно прав") from None

    return Response(status_code=HTTP_204_NO_CONTENT)
