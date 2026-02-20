namespace RentalService;

/**
 * Город
 */
model City {
  @doc("Уникальный идентификатор города")
  id: int64;

  @doc("Название города")
  @minLength(2)
  @maxLength(100)
  name: string;
}

/**
 * Данные для создания/обновления города
 */
model CityCreate {
  @doc("Название города")
  @minLength(2)
  @maxLength(100)
  name: string;
}
