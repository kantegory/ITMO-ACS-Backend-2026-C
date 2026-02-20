namespace RentalService;

/**
 * Удобство (комфорт)
 */
model Comfort {
  @doc("Уникальный идентификатор удобства")
  id: int64;

  @doc("Название удобства")
  @minLength(2)
  @maxLength(100)
  name: string;

  @doc("Иконка удобства (название или URL)")
  icon?: string;
}

/**
 * Данные для создания/обновления удобства
 */
model ComfortCreate {
  @doc("Название удобства")
  @minLength(2)
  @maxLength(100)
  name: string;

  @doc("Иконка удобства")
  icon?: string;
}
