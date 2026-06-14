class AuthError(Exception):
    """Базовая ошибка аутентификации."""


class EmailAlreadyRegisteredError(AuthError):
    """Пользователь с таким email уже зарегистрирован."""


class InvalidCredentialsError(AuthError):
    """Неверный email или пароль."""


class InvalidTokenError(AuthError):
    """Некорректный или просроченный токен."""


class UserNotFoundError(Exception):
    """Пользователь не найден."""


class PasswordMismatchError(Exception):
    """Указан неверный текущий пароль."""
