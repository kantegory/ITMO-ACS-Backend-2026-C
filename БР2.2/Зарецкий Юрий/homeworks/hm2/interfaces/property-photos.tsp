import "../models/property.tsp";
import "../models/property-photo.tsp";
import "../models/error.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Управление фотографиями объектов недвижимости
 */
@route("/properties/{propertyId}/photos")
@tag("Фотографии")
interface PropertyPhotos {
  /**
   * Получить все фотографии объекта
   */
  @get
  @summary("Список фотографий объекта")
  list(
    @path propertyId: int64
  ): {
    @body body: {
      data: PropertyPhoto[];
    };
  } | NotFoundError;

  /**
   * Загрузить фотографию
   * 
   * Загружает новую фотографию для объекта.
   * Только владелец может загружать фото.
   * Максимум 20 фотографий на объект.
   */
  @post
  @summary("Загрузить фотографию")
  upload(
    @header("Authorization") authorization: string,
    @header("Content-Type") contentType: "multipart/form-data",
    @path propertyId: int64,
    @multipartBody body: PhotoUploadRequest
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<PropertyPhoto>;
  } | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | {
    @statusCode statusCode: 413;
    @body body: ApiError;
  };

  /**
   * Обновить данные фотографии
   * 
   * Изменяет порядок или устанавливает фото как главное.
   */
  @route("/{photoId}")
  @patch
  @summary("Обновить фотографию")
  update(
    @header("Authorization") authorization: string,
    @path propertyId: int64,
    @path photoId: int64,
    @body body: PhotoUpdate
  ): SingleResponse<PropertyPhoto> | UnauthorizedError | ForbiddenError | NotFoundError;

  /**
   * Удалить фотографию
   */
  @route("/{photoId}")
  @delete
  @summary("Удалить фотографию")
  delete(
    @header("Authorization") authorization: string,
    @path propertyId: int64,
    @path photoId: int64
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError;
}
