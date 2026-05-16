from pydantic import BaseModel, ConfigDict

from app.db.users import User


class UserCreatedPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    email: str
    full_name: str
    phone: str | None
    avatar_url: str | None

    @classmethod
    def from_user(cls, user: User) -> "UserCreatedPayload":
        return cls(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
        )


class UserUpdatedPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    phone: str | None
    avatar_url: str | None

    @classmethod
    def from_user(cls, user: User) -> "UserUpdatedPayload":
        return cls(
            user_id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
        )
