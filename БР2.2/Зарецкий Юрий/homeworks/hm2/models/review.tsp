import "./user.tsp";
import "./property.tsp";

namespace RentalService;

/**
 * Отзыв
 */
model Review {
  @doc("Уникальный идентификатор отзыва")
  id: int64;

  @doc("ID объекта недвижимости (опционально)")
  propertyId?: int64;

  @doc("Объект недвижимости")
  property?: PropertyShort;

  @doc("ID автора отзыва")
  authorId: int64;

  @doc("Автор отзыва")
  author: UserShort;

  @doc("ID получателя отзыва (пользователь)")
  targetUserId?: int64;

  @doc("Получатель отзыва")
  targetUser?: UserShort;

  @doc("Оценка от 1 до 5")
  @minValue(1)
  @maxValue(5)
  rating: int32;

  @doc("Текст отзыва")
  @minLength(10)
  @maxLength(2000)
  comment: string;

  @doc("Дата создания")
  createdAt: utcDateTime;

  @doc("Дата обновления")
  updatedAt: utcDateTime;
}

/**
 * Данные для создания отзыва об объекте
 */
model PropertyReviewCreate {
  @doc("ID объекта недвижимости")
  propertyId: int64;

  @doc("Оценка от 1 до 5")
  @minValue(1)
  @maxValue(5)
  rating: int32;

  @doc("Текст отзыва")
  @minLength(10)
  @maxLength(2000)
  comment: string;
}

/**
 * Данные для создания отзыва о пользователе
 */
model UserReviewCreate {
  @doc("ID пользователя")
  targetUserId: int64;

  @doc("ID связанного объекта (опционально)")
  propertyId?: int64;

  @doc("Оценка от 1 до 5")
  @minValue(1)
  @maxValue(5)
  rating: int32;

  @doc("Текст отзыва")
  @minLength(10)
  @maxLength(2000)
  comment: string;
}

/**
 * Данные для обновления отзыва
 */
model ReviewUpdate {
  @doc("Оценка от 1 до 5")
  @minValue(1)
  @maxValue(5)
  rating?: int32;

  @doc("Текст отзыва")
  @minLength(10)
  @maxLength(2000)
  comment?: string;
}
