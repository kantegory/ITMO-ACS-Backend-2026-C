from datetime import date

import structlog

from app.db.deals import DealsRepo, RentDeal
from app.db.properties import PropertiesRepo
from app.enums import DealStatus
from app.schemas.dto import RentDealCreateDTO, require_deal_timestamps
from app.schemas.queries import DealsForPropertyQuery
from app.schemas.requests import CreateRentDealRequest, UpdateDealStatusRequest
from app.schemas.responses import (
    AvailabilityResponse,
    RentDealInternalResponse,
    RentDealListResponse,
    RentDealResponse,
    pagination_meta,
)
from app.services.errors import (
    CannotRentOwnPropertyError,
    DealAccessDeniedError,
    DealNotFoundError,
    DealNotInRequestedStatusError,
    InvalidDateRangeError,
    InvalidDealActionError,
    NotOwnerError,
    PropertyNotActiveError,
    PropertyNotFoundError,
    RentalPeriodConflictError,
)

logger = structlog.get_logger()


class DealsService:
    def __init__(self, deals_repo: DealsRepo, properties_repo: PropertiesRepo) -> None:
        self._deals_repo = deals_repo
        self._properties_repo = properties_repo

    def _to_response(self, deal: RentDeal) -> RentDealResponse:
        created_at, updated_at = require_deal_timestamps(deal.created_at, deal.updated_at)

        return RentDealResponse(
            id=deal.id,
            start_date=deal.start_date,
            end_date=deal.end_date,
            status=DealStatus(deal.status),
            total_price=deal.total_price,
            comment=deal.comment,
            cancellation_reason=deal.cancellation_reason,
            property_id=deal.property_id,
            tenant_id=deal.tenant_id,
            owner_id=deal.owner_id,
            created_at=created_at,
            updated_at=updated_at,
        )

    def _deal_days(self, start: date, end: date) -> int:
        return (end - start).days

    async def create(self, tenant_id: int, data: CreateRentDealRequest) -> RentDealResponse:
        prop = await self._properties_repo.get_by_id(data.property_id)

        if prop is None:
            raise PropertyNotFoundError

        if not prop.is_active:
            raise PropertyNotActiveError

        if prop.owner_id == tenant_id:
            raise CannotRentOwnPropertyError

        days = self._deal_days(data.start_date, data.end_date)

        if days <= 0:
            raise InvalidDateRangeError

        conflicts = await self._deals_repo.count_conflicts(
            property_id=data.property_id,
            start_date=data.start_date,
            end_date=data.end_date,
        )

        if conflicts > 0:
            raise RentalPeriodConflictError

        total_price = float(days) * prop.price_per_day

        deal = await self._deals_repo.create(
            RentDealCreateDTO(
                start_date=data.start_date,
                end_date=data.end_date,
                total_price=total_price,
                comment=data.comment,
                property_id=data.property_id,
                tenant_id=tenant_id,
                owner_id=prop.owner_id,
                status=DealStatus.REQUESTED.value,
            ),
        )

        logger.info("Создана заявка на аренду", deal_id=deal.id, property_id=data.property_id)

        return self._to_response(deal)

    async def check_availability(
        self,
        *,
        property_id: int,
        start_date: date,
        end_date: date,
    ) -> AvailabilityResponse:
        days = self._deal_days(start_date, end_date)

        if days <= 0:
            return AvailabilityResponse(available=False, conflicts=0)

        conflicts = await self._deals_repo.count_conflicts(
            property_id=property_id,
            start_date=start_date,
            end_date=end_date,
        )

        return AvailabilityResponse(available=conflicts == 0, conflicts=conflicts)

    async def list_for_property(
        self,
        user_id: int,
        property_id: int,
        query: DealsForPropertyQuery,
    ) -> RentDealListResponse:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        if prop.owner_id != user_id:
            raise NotOwnerError

        params = query.to_list_params()
        rows, total = await self._deals_repo.list_by_property(property_id, params)

        return RentDealListResponse(
            data=[self._to_response(d) for d in rows],
            pagination=pagination_meta(page=params.page, limit=params.limit, total=total),
        )

    async def get_by_id(self, user_id: int, deal_id: int) -> RentDealResponse:
        deal = await self._deals_repo.get_by_id(deal_id)

        if deal is None:
            raise DealNotFoundError

        if user_id not in (deal.tenant_id, deal.owner_id):
            raise DealAccessDeniedError

        return self._to_response(deal)

    async def update_status(self, user_id: int, deal_id: int, data: UpdateDealStatusRequest) -> RentDealResponse:
        deal = await self._deals_repo.get_by_id(deal_id)

        if deal is None:
            raise DealNotFoundError

        if user_id not in (deal.tenant_id, deal.owner_id):
            raise DealAccessDeniedError

        if deal.status != DealStatus.REQUESTED.value:
            raise DealNotInRequestedStatusError

        if data.status == DealStatus.REQUESTED:
            raise InvalidDealActionError

        if data.status == DealStatus.APPROVED and user_id != deal.owner_id:
            raise DealAccessDeniedError

        if data.status == DealStatus.CANCELLED and user_id not in (deal.owner_id, deal.tenant_id):
            raise DealAccessDeniedError

        updated = await self._deals_repo.update_status(
            deal_id,
            status=data.status.value,
            cancellation_reason=data.cancellation_reason,
        )

        if updated is None:
            raise DealNotFoundError

        logger.info("Обновлён статус сделки", deal_id=deal_id, status=data.status.value)

        return self._to_response(updated)

    async def list_my_rentals(self, tenant_id: int, *, page: int, limit: int) -> RentDealListResponse:
        rows, total = await self._deals_repo.list_by_tenant(tenant_id, page=page, limit=limit)

        return RentDealListResponse(
            data=[self._to_response(d) for d in rows],
            pagination=pagination_meta(page=page, limit=limit, total=total),
        )

    async def list_my_bookings(self, owner_id: int, *, page: int, limit: int) -> RentDealListResponse:
        rows, total = await self._deals_repo.list_by_owner(owner_id, page=page, limit=limit)

        return RentDealListResponse(
            data=[self._to_response(d) for d in rows],
            pagination=pagination_meta(page=page, limit=limit, total=total),
        )

    async def get_internal(self, deal_id: int) -> RentDealInternalResponse:
        deal = await self._deals_repo.get_by_id(deal_id)

        if deal is None:
            raise DealNotFoundError

        return RentDealInternalResponse.model_validate(deal)
