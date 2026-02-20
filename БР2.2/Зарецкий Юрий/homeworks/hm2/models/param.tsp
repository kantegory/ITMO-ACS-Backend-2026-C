import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Параметры пагинации для списков
 */
model PaginationParams {
  @query
  @doc("Номер страницы (начиная с 1)")
  page?: int32 = 1;

  @query
  @doc("Количество элементов на странице (макс. 100)")
  @minValue(1)
  @maxValue(100)
  limit?: int32 = 20;
}

/**
 * Параметры сортировки
 */
model SortParams {
  @query
  @doc("Поле для сортировки")
  sortBy?: string;

  @query
  @doc("Направление сортировки")
  sortOrder?: "asc" | "desc" = "asc";
}

/**
 * Метаданные пагинации в ответе
 */
model PaginationMeta {
  @doc("Текущая страница")
  currentPage: int32;

  @doc("Количество элементов на странице")
  perPage: int32;

  @doc("Общее количество элементов")
  totalItems: int32;

  @doc("Общее количество страниц")
  totalPages: int32;

  @doc("Есть ли следующая страница")
  hasNextPage: boolean;

  @doc("Есть ли предыдущая страница")
  hasPrevPage: boolean;
}

/**
 * Обёртка для списков с пагинацией
 */
model PaginatedResponse<T> {
  @doc("Массив данных")
  data: T[];

  @doc("Метаданные пагинации")
  pagination: PaginationMeta;
}

/**
 * Обёртка для одиночного ответа
 */
model SingleResponse<T> {
  @doc("Данные")
  data: T;
}

/**
 * Успешный ответ без данных
 */
model SuccessResponse {
  @doc("Статус операции")
  success: true;

  @doc("Сообщение")
  message: string;
}
