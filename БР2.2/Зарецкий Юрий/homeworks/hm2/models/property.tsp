import "./user.tsp";
import "./city.tsp";
import "./comfort.tsp";

namespace RentalService;

/**
 * Тип недвижимости
 */
enum PropertyType {
  @doc("Квартира")
  flat,

  @doc("Комната")
  room,

  @doc("Дом")
  house,
}

/**
 * Объект недвижимости
 */
model Property {
  @doc("Уникальный идентификатор объекта")
  id: int64;

  @doc("ID владельца")
  ownerId: int64;

  @doc("Владелец объекта")
  owner: UserShort;

  @doc("ID города")
  cityId: int64;

  @doc("Город")
  city: City;

  @doc("Заголовок объявления")
  @minLength(5)
  @maxLength(200)
  title: string;

  @doc("Подробное описание")
  @maxLength(5000)
  description: string;

  @doc("Тип недвижимости")
  type: PropertyType;

  @doc("Цена за сутки в рублях")
  @minValue(0)
  pricePerDay: decimal;

  @doc("Адрес объекта")
  @minLength(5)
  @maxLength(500)
  address: string;

  @doc("Количество комнат")
  @minValue(1)
  roomsCount?: int32;

  @doc("Площадь в кв.м")
  @minValue(1)
  area?: float32;

  @doc("Максимальное количество гостей")
  @minValue(1)
  maxGuests?: int32;

  @doc("Список удобств")
  comforts: Comfort[];

  @doc("Фотографии объекта")
  photos: PropertyPhoto[];

  @doc("Объект активен и доступен для бронирования")
  isActive: boolean;

  @doc("Средний рейтинг")
  @minValue(0)
  @maxValue(5)
  averageRating?: float32;

  @doc("Количество отзывов")
  reviewsCount: int32;

  @doc("Дата создания объявления")
  createdAt: utcDateTime;

  @doc("Дата последнего обновления")
  updatedAt: utcDateTime;
}

/**
 * Краткая информация об объекте (для списков)
 */
model PropertyShort {
  @doc("ID объекта")
  id: int64;

  @doc("Заголовок")
  title: string;

  @doc("Тип недвижимости")
  type: PropertyType;

  @doc("Цена за сутки")
  pricePerDay: decimal;

  @doc("Город")
  city: City;

  @doc("Адрес")
  address: string;

  @doc("URL главного фото")
  mainPhotoUrl?: string;

  @doc("Средний рейтинг")
  averageRating?: float32;

  @doc("Количество отзывов")
  reviewsCount: int32;

  @doc("Владелец")
  owner: UserShort;
}

/**
 * Данные для создания объекта недвижимости
 */
model PropertyCreate {
  @doc("ID города")
  cityId: int64;

  @doc("Заголовок объявления")
  @minLength(5)
  @maxLength(200)
  title: string;

  @doc("Подробное описание")
  @maxLength(5000)
  description: string;

  @doc("Тип недвижимости")
  type: PropertyType;

  @doc("Цена за сутки в рублях")
  @minValue(0)
  pricePerDay: decimal;

  @doc("Адрес объекта")
  @minLength(5)
  @maxLength(500)
  address: string;

  @doc("Количество комнат")
  @minValue(1)
  roomsCount?: int32;

  @doc("Площадь в кв.м")
  @minValue(1)
  area?: float32;

  @doc("Максимальное количество гостей")
  @minValue(1)
  maxGuests?: int32;

  @doc("ID удобств")
  comfortIds?: int64[];
}

/**
 * Данные для обновления объекта недвижимости
 */
model PropertyUpdate {
  @doc("ID города")
  cityId?: int64;

  @doc("Заголовок объявления")
  @minLength(5)
  @maxLength(200)
  title?: string;

  @doc("Подробное описание")
  @maxLength(5000)
  description?: string;

  @doc("Тип недвижимости")
  type?: PropertyType;

  @doc("Цена за сутки в рублях")
  @minValue(0)
  pricePerDay?: decimal;

  @doc("Адрес объекта")
  @minLength(5)
  @maxLength(500)
  address?: string;

  @doc("Количество комнат")
  @minValue(1)
  roomsCount?: int32;

  @doc("Площадь в кв.м")
  @minValue(1)
  area?: float32;

  @doc("Максимальное количество гостей")
  @minValue(1)
  maxGuests?: int32;

  @doc("ID удобств")
  comfortIds?: int64[];

  @doc("Активность объявления")
  isActive?: boolean;
}

/**
 * Фотография объекта недвижимости
 */
model PropertyPhoto {
  @doc("ID фотографии")
  id: int64;

  @doc("ID объекта")
  propertyId: int64;

  @doc("URL фотографии")
  url: string;

  @doc("Порядок отображения")
  sortOrder: int32;

  @doc("Является главным фото")
  isMain: boolean;

  @doc("Дата загрузки")
  createdAt: utcDateTime;
}
