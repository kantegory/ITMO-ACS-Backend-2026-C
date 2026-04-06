from pydantic import BaseModel, Field


class CreateConversationRequest(BaseModel):
    user_id: int = Field(ge=1, description="Идентификатор собеседника")
    property_id: int = Field(ge=1)


class SendMessageRequest(BaseModel):
    text: str = Field(min_length=1)


class CreatePropertyReviewRequest(BaseModel):
    property_id: int = Field(ge=1)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1)


class CreateUserReviewRequest(BaseModel):
    target_user_id: int = Field(ge=1)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1)


class UpdateReviewRequest(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, min_length=1)
