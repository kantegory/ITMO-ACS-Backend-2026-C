from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.dto import DealListParams, PropertyCatalogFilters, PropertyCatalogListParams


class PropertyCatalogQuery(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    search: str | None = Field(default=None, description="Поиск по названию и описанию")
    city_id: int | None = None
    property_type: str | None = Field(default=None, alias="type", description="Тип: flat, room, house")
    price_min: float | None = None
    price_max: float | None = None
    rooms_min: int | None = None
    rooms_max: int | None = None
    guests_min: int | None = None
    sort_by: str = "created_at"
    sort_order: str = Field(default="DESC", description="ASC или DESC")
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    @field_validator("sort_order")
    @classmethod
    def uppercase_order(cls, v: str) -> str:
        return v.upper()

    def to_list_params(self) -> PropertyCatalogListParams:
        filters = PropertyCatalogFilters(
            search=self.search,
            city_id=self.city_id,
            property_type=self.property_type,
            price_min=self.price_min,
            price_max=self.price_max,
            rooms_min=self.rooms_min,
            rooms_max=self.rooms_max,
            guests_min=self.guests_min,
            only_active=True,
        )

        return PropertyCatalogListParams(
            filters=filters,
            sort_by=self.sort_by,
            sort_order=self.sort_order,
            page=self.page,
            limit=self.limit,
        )


class DealsForPropertyQuery(BaseModel):
    status: str | None = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    def to_list_params(self) -> DealListParams:
        return DealListParams(status=self.status, page=self.page, limit=self.limit)
