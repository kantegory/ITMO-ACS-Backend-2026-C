import "../models/user.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "../models/rent-deal.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Управление профилем пользователя
 */
@route("/users")
@tag("Пользователи")
interface Users {
  /**
   * Получить текущего пользователя
   * 
   * Возвращает профиль авторизованного пользователя с расширенной статистикой.
   */
  @route("/me")
  @get
  @summary("Получить свой профиль")
  getMe(
    @header("Authorization") authorization: string
  ): SingleResponse<UserProfile> | UnauthorizedError;

  /**
   * Обновить профиль
   * 
   * Обновляет данные профиля текущего пользователя.
   */
  @route("/me")
  @patch
  @summary("Обновить свой профиль")
  updateMe(
    @header("Authorization") authorization: string,
    @body body: UserUpdate
  ): SingleResponse<User> | UnauthorizedError | ValidationError;

  /**
   * Сменить пароль
   * 
   * Изменяет пароль текущего пользователя.
   */
  @route("/me/password")
  @put
  @summary("Сменить пароль")
  changePassword(
    @header("Authorization") authorization: string,
    @body body: PasswordChange
  ): SuccessResponse | UnauthorizedError | ValidationError;

  /**
   * История сделок пользователя (как арендатор)
   * 
   * Список всех сделок, где текущий пользователь является арендатором.
   */
  @route("/me/rentals")
  @get
  @summary("Мои аренды (как арендатор)")
  getMyRentals(
    @header("Authorization") authorization: string,
    @query status?: DealStatus,
    ...PaginationParams
  ): PaginatedResponse<RentDealShort> | UnauthorizedError;

  /**
   * История сделок пользователя (как владелец)
   * 
   * Список всех сделок по объектам текущего пользователя.
   */
  @route("/me/bookings")
  @get
  @summary("Бронирования моих объектов (как владелец)")
  getMyBookings(
    @header("Authorization") authorization: string,
    @query status?: DealStatus,
    ...PaginationParams
  ): PaginatedResponse<RentDealShort> | UnauthorizedError;

  /**
   * Получить профиль пользователя по ID
   * 
   * Публичная информация о пользователе.
   */
  @route("/{userId}")
  @get
  @summary("Получить профиль пользователя")
  getUser(
    @path userId: int64
  ): SingleResponse<UserProfile> | NotFoundError;
}
