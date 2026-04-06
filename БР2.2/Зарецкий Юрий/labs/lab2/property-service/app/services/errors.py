class CityNotFoundError(Exception):
    """Город не найден."""


class ComfortNotFoundError(Exception):
    """Удобство не найдено."""


class PropertyNotFoundError(Exception):
    """Объект не найден."""


class PhotoNotFoundError(Exception):
    """Фотография не найдена."""


class DealNotFoundError(Exception):
    """Сделка не найдена."""


class NotOwnerError(Exception):
    """Операция доступна только владельцу объекта."""


class MaxPhotosExceededError(Exception):
    """Превышен лимит количества фотографий."""


class PropertyNotActiveError(Exception):
    """Объект не активен."""


class CannotRentOwnPropertyError(Exception):
    """Нельзя арендовать собственный объект."""


class InvalidDateRangeError(Exception):
    """Некорректный диапазон дат."""


class RentalPeriodConflictError(Exception):
    """Период аренды пересекается с существующими бронированиями."""


class DealNotInRequestedStatusError(Exception):
    """Статус сделки изменить нельзя: ожидался requested."""


class DealAccessDeniedError(Exception):
    """Недостаточно прав для операции со сделкой."""


class InvalidDealActionError(Exception):
    """Некорректное действие со сделкой."""


class InvalidTokenError(Exception):
    """Некорректный или просроченный токен."""

