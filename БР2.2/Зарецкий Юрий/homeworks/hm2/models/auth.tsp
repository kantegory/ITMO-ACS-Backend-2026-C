namespace RentalService;

/**
 * Данные для входа в систему
 */
model LoginRequest {
  @doc("Email пользователя")
  @format("email")
  email: string;

  @doc("Пароль")
  @secret
  password: string;
}

/**
 * Ответ при успешной аутентификации
 */
model AuthResponse {
  @doc("JWT Access Token")
  accessToken: string;

  @doc("JWT Refresh Token для обновления access token")
  refreshToken: string;

  @doc("Тип токена")
  tokenType: "Bearer";

  @doc("Время жизни access token в секундах")
  expiresIn: int32;

  @doc("Данные пользователя")
  user: User;
}

/**
 * Запрос на обновление токена
 */
model RefreshTokenRequest {
  @doc("Refresh Token")
  refreshToken: string;
}

/**
 * Ответ с новыми токенами
 */
model TokenResponse {
  @doc("Новый Access Token")
  accessToken: string;

  @doc("Новый Refresh Token")
  refreshToken: string;

  @doc("Тип токена")
  tokenType: "Bearer";

  @doc("Время жизни access token в секундах")
  expiresIn: int32;
}
