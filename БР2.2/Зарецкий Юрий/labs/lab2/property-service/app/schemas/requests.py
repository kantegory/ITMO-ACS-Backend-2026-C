from datetime import date

from pydantic import BaseModel, Field

from app.enums import DealStatus, PropertyType
from app.schemas.dto import PropertyCreateDTO, PropertyUpdateDTO


class CreateCityRequest(BaseModel):
    name: str = Field(max_length=100)


class UpdateCityRequest(BaseModel):
    name: str = Field(max_length=100)


class CreateComfortRequest(BaseModel):
    name: str = Field(max_length=100)
    icon: str | None = Field(default=None, max_length=200)


class UpdateComfortRequest(BaseModel):
    name: str = Field(max_length=100)
    icon: str | None = Field(default=None, max_length=200)


class CreatePropertyRequest(BaseModel):
    title: str = Field(max_length=200)
    description: str
    type: PropertyType
    price_per_day: float = Field(gt=0)
    address: str = Field(max_length=500)
    rooms_count: int | None = Field(default=None, ge=0)
    area: float | None = Field(default=None, gt=0)
    max_guests: int | None = Field(default=None, ge=0)
    city_id: int = Field(ge=1)
    comfort_ids: list[int] = Field(default_factory=list)

    def to_create_dto(self, owner_id: int) -> PropertyCreateDTO:
        return PropertyCreateDTO(
            title=self.title,
            description=self.description,
            property_type=self.type.value,
            price_per_day=self.price_per_day,
            address=self.address,
            rooms_count=self.rooms_count,
            area=self.area,
            max_guests=self.max_guests,
            owner_id=owner_id,
            city_id=self.city_id,
            comfort_ids=self.comfort_ids,
        )


class UpdatePropertyRequest(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str | None = None
    type: PropertyType | None = None
    price_per_day: float | None = Field(default=None, gt=0)
    address: str | None = Field(default=None, max_length=500)
    rooms_count: int | None = Field(default=None, ge=0)
    area: float | None = Field(default=None, gt=0)
    max_guests: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    city_id: int | None = Field(default=None, ge=1)
    comfort_ids: list[int] | None = None

    def to_update_dto(self) -> PropertyUpdateDTO:
        return PropertyUpdateDTO(
            title=self.title,
            description=self.description,
            property_type=self.type.value if self.type is not None else None,
            price_per_day=self.price_per_day,
            address=self.address,
            rooms_count=self.rooms_count,
            area=self.area,
            max_guests=self.max_guests,
            is_active=self.is_active,
            city_id=self.city_id,
            comfort_ids=self.comfort_ids,
        )


class CreatePhotoRequest(BaseModel):
    url: str = Field(max_length=500)
    sort_order: int = Field(default=0, ge=0)
    is_main: bool = False


class UpdatePhotoRequest(BaseModel):
    url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = Field(default=None, ge=0)
    is_main: bool | None = None


class CreateRentDealRequest(BaseModel):
    property_id: int = Field(ge=1)
    start_date: date
    end_date: date
    comment: str | None = None


class UpdateDealStatusRequest(BaseModel):
    status: DealStatus
    cancellation_reason: str | None = None
