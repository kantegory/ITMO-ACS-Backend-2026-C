from datetime import date
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Query
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_502_BAD_GATEWAY,
)

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.queries import DealsForPropertyQuery
from app.schemas.requests import CreateRentDealRequest, UpdateDealStatusRequest
from app.schemas.responses import AvailabilityResponse, RentDealListResponse, RentDealResponse
from app.services.deals import DealsService
from app.services.errors import (
    CannotRentOwnPropertyError,
    DealAccessDeniedError,
    DealNotFoundError,
    DealNotInRequestedStatusError,
    ExternalServiceError,
    InvalidDateRangeError,
    InvalidDealActionError,
    NotOwnerError,
    PropertyNotActiveError,
    PropertyNotFoundError,
    RentalPeriodConflictError,
    UserNotFoundError,
)

router = APIRouter(prefix="/api/rent-deals", tags=["Аренда"])


@router.post("", summary="Создать заявку на аренду", status_code=HTTP_201_CREATED)
@inject
async def create_deal(
    body: CreateRentDealRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
) -> RentDealResponse:
    try:
        return await deals_service.create(user_id, body)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except PropertyNotActiveError:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Объект не активен") from None
    except CannotRentOwnPropertyError:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Нельзя арендовать свой объект") from None
    except InvalidDateRangeError:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Некорректный период дат") from None
    except RentalPeriodConflictError:
        raise HTTPException(
            status_code=HTTP_409_CONFLICT,
            detail="Период занят другими бронированиями",
        ) from None
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None
    except ExternalServiceError:
        raise HTTPException(status_code=HTTP_502_BAD_GATEWAY, detail="Сервис недоступен") from None


@router.get("/check-availability", summary="Проверка доступности периода")
@inject
async def check_availability(
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
    property_id: Annotated[int, Query(ge=1)],
    start_date: Annotated[date, Query()],
    end_date: Annotated[date, Query()],
) -> AvailabilityResponse:
    return await deals_service.check_availability(
        property_id=property_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/property/{property_id}", summary="Сделки по объекту")
@inject
async def deals_by_property(
    property_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
    query: Annotated[DealsForPropertyQuery, Depends()],
) -> RentDealListResponse:
    try:
        return await deals_service.list_for_property(user_id, property_id, query)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except NotOwnerError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Доступно только владельцу") from None


@router.get("/{deal_id}", summary="Детали сделки")
@inject
async def get_deal(
    deal_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
) -> RentDealResponse:
    try:
        return await deals_service.get_by_id(user_id, deal_id)
    except DealNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Сделка не найдена") from None
    except DealAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Нет доступа к сделке") from None


@router.patch("/{deal_id}/status", summary="Изменить статус сделки")
@inject
async def patch_deal_status(
    deal_id: int,
    body: UpdateDealStatusRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
) -> RentDealResponse:
    try:
        return await deals_service.update_status(user_id, deal_id, body)
    except DealNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Сделка не найдена") from None
    except DealAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Недостаточно прав") from None
    except DealNotInRequestedStatusError:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Можно менять только заявки в статусе requested",
        ) from None
    except InvalidDealActionError:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Некорректный статус") from None
