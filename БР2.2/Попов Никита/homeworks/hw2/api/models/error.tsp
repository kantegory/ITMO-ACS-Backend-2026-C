import "@typespec/http";

using Http;

namespace RestaurantApi;

model ApiError {
  code: string;
  message: string;
  details?: string;
}

/**
 * 400 — Ошибка валидации
 */
@error
model ValidationError extends ApiError {
  @statusCode status: 400;
  errors?: Record<string>;
}

/**
 * 401 — Не авторизован
 */
@error
model UnauthorizedError extends ApiError {
  @statusCode status: 401;
}

/**
 * 403 — Нет прав
 */
@error
model ForbiddenError extends ApiError {
  @statusCode status: 403;
}

/**
 * 404 — Не найдено
 */
@error
model NotFoundError extends ApiError {
  @statusCode status: 404;
  resource?: string;
}

/**
 * 409 — Конфликт
 */
@error
model ConflictError extends ApiError {
  @statusCode status: 409;
}

/**
 * 500 — Внутренняя ошибка
 */
@error
model InternalServerError extends ApiError {
  @statusCode status: 500;
}