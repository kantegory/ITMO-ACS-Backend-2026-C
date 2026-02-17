import "../models/property.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Параметры фильтрации объектов недвижимости
 */
model PropertyFilterParams {
  @query
  @doc("Поиск по заголовку и описанию")
  search?: string;

  @query
  @doc("ID города")
  cityId?: int64;

  @query
  @doc("Тип недвижимости")
  type?: PropertyType;

  @query
  @doc("Минимальная цена за сутки")
  @minValue(0)
  priceMin?: decimal;

  @query
  @doc("Максимальная цена за сутки")
  priceMax?: decimal;

  @query
  @doc("Минимальное количество комнат")
  @minValue(1)
  roomsMin?: int32;

  @query
  @doc("Максимальное количество комнат")
  roomsMax?: int32;

  @query
  @doc("Минимальная площадь")
  @minValue(1)
  areaMin?: float32;

  @query
  @doc("Максимальная площадь")
  areaMax?: float32;

  @query
  @doc("Минимальное количество гостей")
  @minValue(1)
  guestsMin?: int32;

  @query
  @doc("ID требуемых удобств (через запятую)")
  comfortIds?: string;

  @query
  @doc("Дата начала аренды (для проверки доступности)")
  availableFrom?: plainDate;

  @query
  @doc("Дата окончания аренды (для проверки доступности)")
  availableTo?: plainDate;
}

/**
 * Управление объектами недвижимости
 */
@route("/properties")
@tag("Недвижимость")
interface Properties {
  /**
   * Поиск объектов недвижимости
   * 
   * Возвращает список объектов с фильтрацией по различным параметрам.
   * Доступен без авторизации.
   */
  @get
  @summary("Поиск объектов недвижимости")
  list(
    ...PropertyFilterParams,
    ...PaginationParams,
    ...SortParams
  ): PaginatedResponse<PropertyShort>;

  /**
   * Получить детали объекта
   * 
   * Полная информация об объекте включая фото, удобства и владельца.
   */
  @route("/{propertyId}")
  @get
  @summary("Детали объекта")
  get(
    @path propertyId: int64
  ): SingleResponse<Property> | NotFoundError;

  /**
   * Создать объект недвижимости
   * 
   * Создаёт новое объявление об аренде.
   * Требуется авторизация.
   */
  @post
  @summary("Создать объект")
  create(
    @header("Authorization") authorization: string,
    @body body: PropertyCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<Property>;
  } | UnauthorizedError | ValidationError | InternalServerError;

  /**
   * Обновить объект недвижимости
   * 
   * Обновляет данные объекта.
   * Только владелец может редактировать.
   */
  @route("/{propertyId}")
  @patch
  @summary("Обновить объект")
  update(
    @header("Authorization") authorization: string,
    @path propertyId: int64,
    @body body: PropertyUpdate
  ): SingleResponse<Property> | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError;

  /**
   * Удалить объект недвижимости
   * 
   * Удаляет объявление.
   * Только владелец может удалить.
   * Нельзя удалить если есть активные бронирования.
   */
  @route("/{propertyId}")
  @delete
  @summary("Удалить объект")
  delete(
    @header("Authorization") authorization: string,
    @path propertyId: int64
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError;

  /**
   * Получить объекты текущего пользователя
   * 
   * Список всех объектов, принадлежащих авторизованному пользователю.
   */
  @route("/my")
  @get
  @summary("Мои объекты")
  getMyProperties(
    @header("Authorization") authorization: string,
    @query isActive?: boolean,
    ...PaginationParams
  ): PaginatedResponse<PropertyShort> | UnauthorizedError;

  /**
   * Получить объекты пользователя
   * 
   * Список всех активных объектов указанного пользователя.
   */
  @route("/user/{userId}")
  @get
  @summary("Объекты пользователя")
  getUserProperties(
    @path userId: int64,
    ...PaginationParams
  ): PaginatedResponse<PropertyShort> | NotFoundError;
}
