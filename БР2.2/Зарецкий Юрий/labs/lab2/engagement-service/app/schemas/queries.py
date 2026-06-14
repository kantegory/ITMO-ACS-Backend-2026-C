from pydantic import BaseModel, Field

from app.schemas.dto import PageParams


class PaginationQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    def to_page_params(self) -> PageParams:
        return PageParams(page=self.page, limit=self.limit)


class MessagesQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=50, ge=1, le=100)

    def to_page_params(self) -> PageParams:
        return PageParams(page=self.page, limit=self.limit)
