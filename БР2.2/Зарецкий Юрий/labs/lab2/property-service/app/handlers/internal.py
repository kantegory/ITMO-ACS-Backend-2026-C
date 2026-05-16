from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from starlette.status import HTTP_404_NOT_FOUND

from app.container import Container
from app.handlers.deps import verify_service_token
from app.schemas.responses import PropertyInternalResponse, RentDealInternalResponse
from app.services.deals import DealsService
from app.services.errors import DealNotFoundError, PropertyNotFoundError
from app.services.properties import PropertiesService

router = APIRouter(prefix="/internal", tags=["Внутренний API"])


@router.get(
    "/properties/{property_id}",
    summary="Данные объекта для межсервисных запросов",
    dependencies=[Depends(verify_service_token)],
)
@inject
async def internal_get_property(
    property_id: int,
    properties_service: Annotated[PropertiesService, Depends(Provide[Container.properties_service])],
) -> PropertyInternalResponse:
    try:
        return await properties_service.get_internal(property_id)
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None


@router.get(
    "/rent-deals/{deal_id}",
    summary="Данные сделки для межсервисных запросов",
    dependencies=[Depends(verify_service_token)],
)
@inject
async def internal_get_deal(
    deal_id: int,
    deals_service: Annotated[DealsService, Depends(Provide[Container.deals_service])],
) -> RentDealInternalResponse:
    try:
        return await deals_service.get_internal(deal_id)
    except DealNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Сделка не найдена") from None
