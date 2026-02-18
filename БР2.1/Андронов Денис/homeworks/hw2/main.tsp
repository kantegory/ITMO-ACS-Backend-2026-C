// подключаем библиотеки для rest и http
import "@typespec/rest";
import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Rest;
using TypeSpec.Http;

// описываем сервис чтобы openapi не был пустым
@service(#{title: "RestOratorAPI"})
namespace RestOratorAPI;

// роли пользователей
enum UserRole {
  ADMIN,
  STAFF,
  USER
}

// статусы бронирования
enum ReservationStatus {
  DECLINED,
  CONFIRMED,
  IN_PROGRESS,
  PASSED
}

// модель пользователя (таблица users)
model User {
  id: int64;
  role: UserRole;
  first_name: string;
  last_name: string;
  middle_name?: string; // необязательное поле
  email: string;
  is_verified: boolean;
  created_at: utcDateTime;
  updated_at: utcDateTime;
}

// модель для регистрации
model RegisterRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password: string;
}

// модель для логина
model LoginRequest {
  email: string;
  password: string;
}

// ответ после авторизации
model AuthResponse {
  access_token: string;
  user: User;
}

// регион (таблица regions)
model Region {
  id: int64;
  external_id: int64; // id из api headhunter
  name: string;
}

// город (таблица cities)
model City {
  id: int64;
  external_id: int64;
  name: string;
  region_id: int64;
}

// кухня (таблица cuisines)
model Cuisine {
  id: int64;
  name: string;
}

// ресторан (таблица restaurants)
model Restaurant {
  id: int64;
  name: string;
  description: string;
  city_id: int64;
  address: string;
  price_category: string;
  phone: string;
  created_at: utcDateTime;
}

// фото ресторана
model RestaurantPhoto {
  id: int64;
  restaurant_id: int64;
  image_url: string;
}

// отзыв
model Review {
  id: int64;
  user_id: int64;
  restaurant_id: int64;
  rating: int32;
  comment: string;
  created_at: utcDateTime;
}

// бронирование
model Reservation {
  id: int64;
  user_id: int64;
  restaurant_id: int64;
  reservation_time: utcDateTime;
  guests_count: int32;
  status: ReservationStatus;
}


// ================== auth ==================

@route("/auth")
namespace Auth {

  // регистрация пользователя
  @post
  @route("/register")
  op register(@body body: RegisterRequest): User;

  // вход в систему
  @post
  @route("/login")
  op login(@body body: LoginRequest): AuthResponse;
}


// ================== users ==================

@route("/users")
namespace Users {

  // получить профиль по id
  @get
  @route("/{id}")
  op getUser(@path id: int64): User;
}


// ================== restaurants ==================

@route("/restaurants")
namespace Restaurants {

  // получить список ресторанов с фильтрацией
  @get
  op listRestaurants(
    @query city_id?: int64,
    @query cuisine_id?: int64,
    @query price_category?: string
  ): Restaurant[];

  // получить ресторан по id
  @get
  @route("/{id}")
  op getRestaurant(@path id: int64): Restaurant;
}


// ================== reservations ==================

@route("/reservations")
namespace Reservations {

  // создать бронирование
  @post
  op createReservation(@body body: Reservation): Reservation;

  // получить историю бронирований пользователя
  @get
  @route("/user/{userId}")
  op getUserReservations(@path userId: int64): Reservation[];
}


// ================== reviews ==================

@route("/reviews")
namespace Reviews {

  // создать отзыв
  @post
  op createReview(@body body: Review): Review;

  // получить отзывы ресторана
  @get
  @route("/restaurant/{restaurantId}")
  op getRestaurantReviews(@path restaurantId: int64): Review[];
}
