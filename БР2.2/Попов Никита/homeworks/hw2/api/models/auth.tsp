namespace RestaurantApi;

model RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

model LoginDto {
  email: string;
  password: string;
}

model AuthTokens {
  accessToken: string;
  refreshToken: string;
}