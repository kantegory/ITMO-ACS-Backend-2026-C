import "./enums.tsp";

model RegisterRequest {
  login: string;
  email: string;
  password: string;
  confPassword: string;
}

model LoginRequest {
  login: string;
  password: string;
}

model token {
  userId: int32;
  issuedAt: int32;
  expiresAt: int32;
}

model accessToken extends token{
  email: string;
  username: string;
  role: UserRole;
}

model refreshToken extends token {
  login: string;
  password: string;
  type: "refresh";
}