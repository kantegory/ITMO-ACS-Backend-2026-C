from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class ConversationCreateDTO:
    user1_id: int
    user2_id: int
    property_id: int


@dataclass(frozen=True, slots=True)
class MessageCreateDTO:
    text: str
    conversation_id: int
    sender_id: int


@dataclass(frozen=True, slots=True)
class ReviewCreateDTO:
    rating: int
    comment: str
    property_id: int | None
    author_id: int
    target_user_id: int | None


@dataclass(frozen=True, slots=True)
class ReviewUpdateDTO:
    rating: int | None
    comment: str | None


@dataclass(frozen=True, slots=True)
class PageParams:
    page: int
    limit: int


def require_conversation_timestamps(
    created_at: datetime | None,
    updated_at: datetime | None,
) -> tuple[datetime, datetime]:
    if created_at is None or updated_at is None:
        msg = "У переписки отсутствуют created_at или updated_at"

        raise RuntimeError(msg)

    return created_at, updated_at


def require_message_timestamp(created_at: datetime | None) -> datetime:
    if created_at is None:
        msg = "У сообщения отсутствует created_at"

        raise RuntimeError(msg)

    return created_at


def require_review_timestamps(
    created_at: datetime | None,
    updated_at: datetime | None,
) -> tuple[datetime, datetime]:
    if created_at is None or updated_at is None:
        msg = "У отзыва отсутствуют created_at или updated_at"

        raise RuntimeError(msg)

    return created_at, updated_at
