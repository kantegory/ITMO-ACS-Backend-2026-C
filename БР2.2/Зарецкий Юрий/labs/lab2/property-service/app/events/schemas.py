from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.db.deals import RentDeal
from app.db.properties import Property


class PropertyCreatedPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    property_id: int
    owner_id: int
    city_id: int
    title: str
    type: str
    is_active: bool

    @classmethod
    def from_property(cls, prop: Property) -> "PropertyCreatedPayload":
        return cls(
            property_id=prop.id,
            owner_id=prop.owner_id,
            city_id=prop.city_id,
            title=prop.title,
            type=prop.type,
            is_active=prop.is_active,
        )


class PropertyUpdatedPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    property_id: int
    owner_id: int
    is_active: bool

    @classmethod
    def from_property(cls, prop: Property) -> "PropertyUpdatedPayload":
        return cls(
            property_id=prop.id,
            owner_id=prop.owner_id,
            is_active=prop.is_active,
        )


class PropertyDeletedPayload(BaseModel):
    property_id: int
    owner_id: int


class DealCreatedPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    deal_id: int
    property_id: int
    tenant_id: int
    owner_id: int
    status: str
    start_date: date
    end_date: date
    total_price: float

    @classmethod
    def from_deal(cls, deal: RentDeal) -> "DealCreatedPayload":
        return cls(
            deal_id=deal.id,
            property_id=deal.property_id,
            tenant_id=deal.tenant_id,
            owner_id=deal.owner_id,
            status=deal.status,
            start_date=deal.start_date,
            end_date=deal.end_date,
            total_price=deal.total_price,
        )


class DealStatusChangedPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    deal_id: int
    property_id: int
    tenant_id: int
    owner_id: int
    status: str
    cancellation_reason: str | None
    updated_at: datetime | None

    @classmethod
    def from_deal(cls, deal: RentDeal) -> "DealStatusChangedPayload":
        return cls(
            deal_id=deal.id,
            property_id=deal.property_id,
            tenant_id=deal.tenant_id,
            owner_id=deal.owner_id,
            status=deal.status,
            cancellation_reason=deal.cancellation_reason,
            updated_at=deal.updated_at,
        )
