import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Запрос на загрузку фотографии
 */
model PhotoUploadRequest {
  @doc("Файл изображения")
  file: HttpPart<bytes>;

  @doc("Порядок отображения")
  sortOrder?: HttpPart<int32>;

  @doc("Установить как главное фото")
  isMain?: HttpPart<boolean>;
}

/**
 * Ответ при загрузке фотографии
 */
model PhotoUploadResponse {
  @doc("ID созданной фотографии")
  id: int64;

  @doc("URL фотографии")
  url: string;

  @doc("Порядок отображения")
  sortOrder: int32;

  @doc("Является главным фото")
  isMain: boolean;
}

/**
 * Обновление данных фотографии
 */
model PhotoUpdate {
  @doc("Порядок отображения")
  sortOrder?: int32;

  @doc("Установить как главное фото")
  isMain?: boolean;
}
