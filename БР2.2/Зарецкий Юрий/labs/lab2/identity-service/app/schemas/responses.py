from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.consts import OAUTH2_TOKEN_TYPE


class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = OAUTH2_TOKEN_TYPE


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    phone: str | None
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime


class UserPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    avatar_url: str | None
    created_at: datetime


class UserInternalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    avatar_url: str | None


class AuthResponse(BaseModel):
    tokens: TokensResponse
    user: UserResponse


class BatchUserExistsResponse(BaseModel):
    exists: dict[int, bool]
