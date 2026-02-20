namespace RentalService;

/**
 * Пользователь системы
 */
model User {
  @doc("Уникальный идентификатор пользователя")
  id: int64;

  @doc("Email пользователя (уникальный)")
  @format("email")
  email: string;

  @doc("Полное имя пользователя")
  @minLength(2)
  @maxLength(100)
  fullName: string;

  @doc("Номер телефона")
  @pattern("^\\+?[0-9]{10,15}$")
  phone?: string;

  @doc("URL аватара пользователя")
  avatarUrl?: string;

  @doc("Дата регистрации")
  createdAt: utcDateTime;

  @doc("Дата последнего обновления профиля")
  updatedAt: utcDateTime;
}

/**
 * Краткая информация о пользователе (для вложенных объектов)
 */
model UserShort {
  @doc("ID пользователя")
  id: int64;

  @doc("Полное имя")
  fullName: string;

  @doc("URL аватара")
  avatarUrl?: string;
}

/**
 * Данные для создания пользователя (регистрация)
 */
model UserCreate {
  @doc("Email пользователя")
  @format("email")
  email: string;

  @doc("Пароль (минимум 8 символов)")
  @minLength(8)
  @maxLength(128)
  @secret
  password: string;

  @doc("Полное имя пользователя")
  @minLength(2)
  @maxLength(100)
  fullName: string;

  @doc("Номер телефона")
  @pattern("^\\+?[0-9]{10,15}$")
  phone?: string;
}

/**
 * Данные для обновления профиля
 */
model UserUpdate {
  @doc("Полное имя пользователя")
  @minLength(2)
  @maxLength(100)
  fullName?: string;

  @doc("Номер телефона")
  @pattern("^\\+?[0-9]{10,15}$")
  phone?: string;

  @doc("URL аватара")
  avatarUrl?: string;
}

/**
 * Данные для смены пароля
 */
model PasswordChange {
  @doc("Текущий пароль")
  @secret
  currentPassword: string;

  @doc("Новый пароль")
  @minLength(8)
  @maxLength(128)
  @secret
  newPassword: string;
}

/**
 * Профиль пользователя с расширенной статистикой
 */
model UserProfile extends User {
  @doc("Количество объектов в собственности")
  propertiesCount: int32;

  @doc("Количество завершённых сделок как арендатор")
  rentalsCount: int32;

  @doc("Средний рейтинг как владелец")
  @minValue(0)
  @maxValue(5)
  ownerRating?: float32;

  @doc("Средний рейтинг как арендатор")
  @minValue(0)
  @maxValue(5)
  tenantRating?: float32;

  @doc("Количество отзывов")
  reviewsCount: int32;
}
