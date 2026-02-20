import "../models/city.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Справочник городов
 */
@route("/cities")
@tag("Справочники")
interface Cities {
  /**
   * Получить список городов
   * 
   * Возвращает список всех доступных городов для фильтрации.
   */
  @get
  @summary("Список городов")
  list(
    @query search?: string,
    ...PaginationParams
  ): PaginatedResponse<City>;

  /**
   * Получить город по ID
   */
  @route("/{cityId}")
  @get
  @summary("Получить город")
  get(
    @path cityId: int64
  ): SingleResponse<City> | NotFoundError;

  /**
   * Создать город (только для админов)
   */
  @post
  @summary("Создать город")
  create(
    @header("Authorization") authorization: string,
    @body body: CityCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<City>;
  } | UnauthorizedError | ForbiddenError | ValidationError;

  /**
   * Обновить город (только для админов)
   */
  @route("/{cityId}")
  @put
  @summary("Обновить город")
  update(
    @header("Authorization") authorization: string,
    @path cityId: int64,
    @body body: CityCreate
  ): SingleResponse<City> | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError;

  /**
   * Удалить город (только для админов)
   */
  @route("/{cityId}")
  @delete
  @summary("Удалить город")
  delete(
    @header("Authorization") authorization: string,
    @path cityId: int64
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError | ConflictError;
}
