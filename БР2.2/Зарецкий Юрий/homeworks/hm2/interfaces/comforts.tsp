import "../models/comfort.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Справочник удобств
 */
@route("/comforts")
@tag("Справочники")
interface Comforts {
  /**
   * Получить список удобств
   * 
   * Возвращает все доступные удобства для объектов.
   */
  @get
  @summary("Список удобств")
  list(): {
    @body body: {
      data: Comfort[];
    };
  };

  /**
   * Получить удобство по ID
   */
  @route("/{comfortId}")
  @get
  @summary("Получить удобство")
  get(
    @path comfortId: int64
  ): SingleResponse<Comfort> | NotFoundError;

  /**
   * Создать удобство (только для админов)
   */
  @post
  @summary("Создать удобство")
  create(
    @header("Authorization") authorization: string,
    @body body: ComfortCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<Comfort>;
  } | UnauthorizedError | ForbiddenError | ValidationError;

  /**
   * Обновить удобство (только для админов)
   */
  @route("/{comfortId}")
  @put
  @summary("Обновить удобство")
  update(
    @header("Authorization") authorization: string,
    @path comfortId: int64,
    @body body: ComfortCreate
  ): SingleResponse<Comfort> | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError;

  /**
   * Удалить удобство (только для админов)
   */
  @route("/{comfortId}")
  @delete
  @summary("Удалить удобство")
  delete(
    @header("Authorization") authorization: string,
    @path comfortId: int64
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError;
}
