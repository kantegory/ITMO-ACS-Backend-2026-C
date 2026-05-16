from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class KafkaDomainEventEnvelope(BaseModel):
    event_type: str
    timestamp: str
    payload: dict[str, Any]


class UserCreatedPayload(BaseModel):
    user_id: int
    email: str
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None


class UserUpdatedPayload(BaseModel):
    user_id: int
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None


class PropertyCreatedPayload(BaseModel):
    property_id: int
    owner_id: int
    city_id: int
    title: str
    type: str
    is_active: bool


class PropertyUpdatedPayload(BaseModel):
    property_id: int
    owner_id: int
    is_active: bool


class PropertyDeletedPayload(BaseModel):
    property_id: int
    owner_id: int


class DealCreatedPayload(BaseModel):
    deal_id: int
    property_id: int
    tenant_id: int
    owner_id: int
    status: str
    start_date: date
    end_date: date
    total_price: float


class DealStatusChangedPayload(BaseModel):
    deal_id: int
    property_id: int
    tenant_id: int
    owner_id: int
    status: str
    cancellation_reason: str | None = None
    updated_at: datetime | None = None
