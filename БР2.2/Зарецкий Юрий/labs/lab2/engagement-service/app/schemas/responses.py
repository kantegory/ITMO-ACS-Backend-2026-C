import math
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaginationResponse(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    is_read: bool
    conversation_id: int
    sender_id: int
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user1_id: int
    user2_id: int
    property_id: int
    created_at: datetime
    updated_at: datetime
    last_message: MessageResponse | None = None


class ConversationListResponse(BaseModel):
    data: list[ConversationResponse]
    pagination: PaginationResponse


class MessageListResponse(BaseModel):
    data: list[MessageResponse]
    pagination: PaginationResponse


class UnreadCountResponse(BaseModel):
    count: int


class MarkReadResponse(BaseModel):
    marked: int


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rating: int
    comment: str
    property_id: int | None
    author_id: int
    target_user_id: int | None
    created_at: datetime
    updated_at: datetime


class ReviewListResponse(BaseModel):
    data: list[ReviewResponse]
    pagination: PaginationResponse


def pagination_meta(*, page: int, limit: int, total: int) -> PaginationResponse:
    safe_limit = max(limit, 1)

    return PaginationResponse(
        page=page,
        limit=limit,
        total=total,
        total_pages=math.ceil(total / safe_limit) if total > 0 else 0,
    )
