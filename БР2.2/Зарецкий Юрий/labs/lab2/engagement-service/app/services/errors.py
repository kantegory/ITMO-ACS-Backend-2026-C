class ConversationNotFoundError(Exception):
    """Переписка не найдена."""


class ConversationAccessDeniedError(Exception):
    """Нет доступа к переписке."""


class MessageNotFoundError(Exception):
    """Сообщение не найдено."""


class ReviewNotFoundError(Exception):
    """Отзыв не найден."""


class ReviewAccessDeniedError(Exception):
    """Нет прав на изменение отзыва."""


class InvalidRatingError(Exception):
    """Некорректная оценка."""


class InvalidTokenError(Exception):
    """Некорректный или просроченный токен."""


class PropertyNotFoundError(Exception):
    """Объект не найден (межсервисная проверка)."""


class UserNotFoundError(Exception):
    """Пользователь не найден (межсервисная проверка)."""


class SelfConversationError(Exception):
    """Нельзя создать переписку с самим собой."""


class SelfReviewError(Exception):
    """Нельзя оставить отзыв самому себе."""


class InvalidReviewPayloadError(Exception):
    """Некорректные поля отзыва."""


class ExternalServiceError(Exception):
    """Ошибка при обращении к другому сервису."""
