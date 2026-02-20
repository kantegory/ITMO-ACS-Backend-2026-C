namespace RentalService;

/**
 * Базовая модель ошибки API
 */
@error
model ApiError {
  @doc("HTTP статус код ошибки")
  statusCode: int32;

  @doc("Краткое описание типа ошибки")
  error: string;

  @doc("Детальное сообщение об ошибке")
  message: string;

  @doc("Временная метка ошибки")
  timestamp: utcDateTime;

  @doc("Путь запроса, вызвавшего ошибку")
  path?: string;

  @doc("Детали валидации (для ошибок 422)")
  details?: ValidationErrorDetail[];
}

/**
 * Детали ошибки валидации
 */
model ValidationErrorDetail {
  @doc("Название поля с ошибкой")
  field: string;

  @doc("Сообщение об ошибке")
  message: string;

  @doc("Переданное значение")
  value?: string;
}

/**
 * 400 Bad Request - Некорректный запрос
 */
@error
model BadRequestError extends ApiError {
  statusCode: 400;
  error: "Bad Request";
}

/**
 * 401 Unauthorized - Требуется аутентификация
 */
@error
model UnauthorizedError extends ApiError {
  statusCode: 401;
  error: "Unauthorized";
  message: "Требуется аутентификация. Предоставьте валидный JWT токен.";
}

/**
 * 403 Forbidden - Доступ запрещён
 */
@error
model ForbiddenError extends ApiError {
  statusCode: 403;
  error: "Forbidden";
  message: "У вас нет прав для выполнения данной операции.";
}

/**
 * 404 Not Found - Ресурс не найден
 */
@error
model NotFoundError extends ApiError {
  statusCode: 404;
  error: "Not Found";
  message: "Запрашиваемый ресурс не найден.";
}

/**
 * 409 Conflict - Конфликт данных
 */
@error
model ConflictError extends ApiError {
  statusCode: 409;
  error: "Conflict";
}

/**
 * 422 Unprocessable Entity - Ошибка валидации
 */
@error
model ValidationError extends ApiError {
  statusCode: 422;
  error: "Unprocessable Entity";
  message: "Ошибка валидации данных.";
}

/**
 * 500 Internal Server Error - Внутренняя ошибка сервера
 */
@error
model InternalServerError extends ApiError {
  statusCode: 500;
  error: "Internal Server Error";
  message: "Произошла внутренняя ошибка сервера. Попробуйте позже.";
}
