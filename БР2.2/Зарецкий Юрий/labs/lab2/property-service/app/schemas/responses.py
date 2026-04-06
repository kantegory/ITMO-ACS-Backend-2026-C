import math
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums import DealStatus, PropertyType


class PaginationResponse(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class CityListResponse(BaseModel):
    data: list[CityResponse]
    pagination: PaginationResponse


class ComfortResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: str | None


class PhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    sort_order: int
    is_main: bool
    property_id: int
    created_at: datetime


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    type: PropertyType
    price_per_day: float
    address: str
    rooms_count: int | None
    area: float | None
    max_guests: int | None
    is_active: bool
    owner_id: int
    city_id: int
    created_at: datetime
    updated_at: datetime
    city: CityResponse | None = None
    photos: list[PhotoResponse] = Field(default_factory=list)


class PropertyDetailResponse(PropertyResponse):
    comforts: list[ComfortResponse] = Field(default_factory=list)


class PropertyCatalogResponse(BaseModel):
    data: list[PropertyResponse]
    pagination: PaginationResponse


class RentDealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_date: date
    end_date: date
    status: DealStatus
    total_price: float
    comment: str | None
    cancellation_reason: str | None
    property_id: int
    tenant_id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class RentDealListResponse(BaseModel):
    data: list[RentDealResponse]
    pagination: PaginationResponse


class AvailabilityResponse(BaseModel):
    available: bool
    conflicts: int


class PropertyInternalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    owner_id: int
    city_id: int
    is_active: bool
    price_per_day: float


class RentDealInternalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: DealStatus
    property_id: int
    tenant_id: int
    owner_id: int
    start_date: date
    end_date: date
    total_price: float


def pagination_meta(*, page: int, limit: int, total: int) -> PaginationResponse:
    safe_limit = max(limit, 1)

    return PaginationResponse(
        page=page,
        limit=limit,
        total=total,
        total_pages=math.ceil(total / safe_limit) if total > 0 else 0,
    )
