// подключаем библиотеки для rest и http
import "@typespec/rest";
import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Rest;
using TypeSpec.Http;

@service(#{ title: "RestOratorAPI" })
namespace RestOratorAPI;


// описываем bearer jwt авторизацию
// в версии 1.9 схема объявляется как alias
alias BearerAuth = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT"
};


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

// сортировка (asc или desc)
enum SortOrder {
  asc,
  desc
}

// модель пользователя (таблица users)
model User {
  id: int64;
  role: UserRole;
  first_name: string;
  last_name: string;
  middle_name?: string;
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
  external_id: int64;
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
  average_rating?: float64;
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

  // получить текущего пользователя по access token
  @get
  @route("/me")
  @useAuth(BearerAuth)
  op getCurrentUser(): User;
}


// ================== restaurants ==================

@route("/restaurants")
namespace Restaurants {

  // получить список ресторанов с фильтрацией
  // добавлена сортировка по цене, рейтингу и поиск по названию
  @get
  op listRestaurants(
    @query city_id?: int64,
    @query cuisine_id?: int64,
    @query price_category?: string,
    @query name?: string,
    @query price_sort?: SortOrder,
    @query rating_sort?: SortOrder
  ): Restaurant[];

  // получить ресторан по id
  @get
  @route("/{id}")
  op getRestaurant(@path id: int64): Restaurant;
}


// ================== reservations ==================

@route("/reservations")
namespace Reservations {

  // создать бронирование (требуется авторизация)
  @post
  @useAuth(BearerAuth)
  op createReservation(@body body: Reservation): Reservation;

  // получить историю бронирований пользователя (admin only)
  // backend должен проверить роль ADMIN после декодирования токена
  @get
  @route("/user/{userId}")
  @useAuth(BearerAuth)
  @doc("admin only endpoint - requires ADMIN role")
  op getUserReservations(@path userId: int64): Reservation[];

  // получить свои бронирования по токену
  // добавлен поиск по датам, ресторану, названию и сортировка по дате
  @get
  @route("/my")
  @useAuth(BearerAuth)
  @doc("Get current user's reservations with optional filters: date range, restaurant id, restaurant name")
  op getMyReservations(
    @query from_date?: utcDateTime,
    @query to_date?: utcDateTime,
    @query restaurant_id?: int64,
    @query name?: string,
    @query sort_by_date?: SortOrder
  ): Reservation[];
}


// ================== reviews ==================

@route("/reviews")
namespace Reviews {

  // создать отзыв (требуется авторизация)
  @post
  @useAuth(BearerAuth)
  op createReview(@body body: Review): Review;

  // получить отзывы ресторана
  // добавлена сортировка по рейтингу
  @get
  @route("/restaurant/{restaurantId}")
  op getRestaurantReviews(
    @path restaurantId: int64,
    @query rating_sort?: SortOrder
  ): Review[];
}