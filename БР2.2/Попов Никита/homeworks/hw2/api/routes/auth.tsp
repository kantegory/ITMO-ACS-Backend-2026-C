import "../models/auth.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantApi;

@tag("Auth")
@route("/api/v1/auth")
interface AuthApi {

  @post
  @route("/register")
  register(@body body: RegisterDto):
    ApiResponse<AuthTokens>
    | ValidationError;

  @post
  @route("/login")
  login(@body body: LoginDto):
    ApiResponse<AuthTokens>;
}