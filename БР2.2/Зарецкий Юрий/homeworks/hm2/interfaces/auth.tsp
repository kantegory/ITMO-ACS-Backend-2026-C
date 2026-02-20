import "../models/auth.tsp";
import "../models/user.tsp";
import "../models/error.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Аутентификация и авторизация
 */
@route("/auth")
@tag("Аутентификация")
interface Auth {
  /**
   * Регистрация нового пользователя
   * 
   * Создаёт новую учётную запись пользователя.
   * После успешной регистрации автоматически выполняется вход.
   */
  @route("/register")
  @post
  @summary("Регистрация нового пользователя")
  register(
    @body body: UserCreate
  ): {
    @statusCode statusCode: 201;
    @body body: AuthResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ConflictError;
  } | ValidationError | InternalServerError;

  /**
   * Вход в систему
   * 
   * Аутентификация по email и паролю.
   * Возвращает JWT токены для последующих запросов.
   */
  @route("/login")
  @post
  @summary("Вход в систему")
  login(
    @body body: LoginRequest
  ): AuthResponse | UnauthorizedError | ValidationError | InternalServerError;

  /**
   * Обновление JWT токена
   * 
   * Использует refresh token для получения новой пары токенов.
   */
  @route("/refresh")
  @post
  @summary("Обновление токена")
  refresh(
    @body body: RefreshTokenRequest
  ): TokenResponse | UnauthorizedError | InternalServerError;

  /**
   * Выход из системы
   * 
   * Инвалидирует текущий refresh token.
   */
  @route("/logout")
  @post
  @summary("Выход из системы")
  logout(
    @header("Authorization") authorization: string,
    @body body: RefreshTokenRequest
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError;
}
