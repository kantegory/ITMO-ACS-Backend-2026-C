from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Query

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.responses import RentDealListResponse
from app.services.deals import DealsService

router = APIRouter(prefix="/api/users", tags=["Пользователь и аренда"])


@router.get("/me/rentals", summary="Мои аренды как арендатор")
@inject
async def my_rentals(
    user_id: Annotated[int, Depends(get_current_user_id)],
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> RentDealListResponse:
    return await deals_service.list_my_rentals(user_id, page=page, limit=limit)


@router.get("/me/bookings", summary="Мои бронирования как владелец")
@inject
async def my_bookings(
    user_id: Annotated[int, Depends(get_current_user_id)],
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> RentDealListResponse:
    return await deals_service.list_my_bookings(user_id, page=page, limit=limit)
