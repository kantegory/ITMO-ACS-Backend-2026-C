from dataclasses import dataclass
from datetime import date, datetime


@dataclass(frozen=True, slots=True)
class PropertyCatalogFilters:
    search: str | None
    city_id: int | None
    property_type: str | None
    price_min: float | None
    price_max: float | None
    rooms_min: int | None
    rooms_max: int | None
    guests_min: int | None
    only_active: bool


@dataclass(frozen=True, slots=True)
class PropertyCatalogListParams:
    filters: PropertyCatalogFilters
    sort_by: str
    sort_order: str
    page: int
    limit: int


@dataclass(frozen=True, slots=True)
class PropertyCreateDTO:
    title: str
    description: str
    property_type: str
    price_per_day: float
    address: str
    rooms_count: int | None
    area: float | None
    max_guests: int | None
    owner_id: int
    city_id: int
    comfort_ids: list[int]


@dataclass(frozen=True, slots=True)
class PropertyUpdateDTO:
    title: str | None
    description: str | None
    property_type: str | None
    price_per_day: float | None
    address: str | None
    rooms_count: int | None
    area: float | None
    max_guests: int | None
    is_active: bool | None
    city_id: int | None
    comfort_ids: list[int] | None


@dataclass(frozen=True, slots=True)
class RentDealCreateDTO:
    start_date: date
    end_date: date
    total_price: float
    comment: str | None
    property_id: int
    tenant_id: int
    owner_id: int
    status: str


@dataclass(frozen=True, slots=True)
class DealListParams:
    status: str | None
    page: int
    limit: int


@dataclass(frozen=True, slots=True)
class PageParams:
    page: int
    limit: int


def require_property_timestamps(
    created_at: datetime | None,
    updated_at: datetime | None,
) -> tuple[datetime, datetime]:
    if created_at is None or updated_at is None:
        msg = "У объекта отсутствуют created_at или updated_at"

        raise RuntimeError(msg)

    return created_at, updated_at


def require_deal_timestamps(
    created_p: datetime | None,
    updated_p: datetime | None,
) -> tuple[datetime, datetime]:
    if created_p is None or updated_p is None:
        msg = "У сделки отсутствуют created_at или updated_at"

        raise RuntimeError(msg)

    return created_p, updated_p
