import "../models/auth.tsp";
import "../models/error.tsp";
import "../models/user.tsp";
import "@typespec/http";

using Http;

namespace FoodSource;

@route("/auth")
interface Auth {
  @post
  @route("register")
  op register(...RegisterRequest): {
    @statusCode statusCode: 201;
    @body body: {
      user: user;
      accessToken: string;
      refreshToken?: string;
    };
  } | UnauthorizedError | ConflictError | ValidationError;

  @post
  @route("login")
  op login(...LoginRequest): {
    @statusCode statusCode: 200;
    @body body: {
      user: user;
      accessToken: string;
      refreshToken?: string;
    };
  } | UnauthorizedError | ValidationError;

  @post
  @route("logout")
  op logout(@header authorization: string): {
    @statusCode statusCode: 204;
  } | UnauthorizedError;

  @post
  @route("refresh")
  op refresh(@body body: { refreshToken: string }): {
    @statusCode statusCode: 200;
    @body body: {
      accessToken: string;
      refreshToken?: string;
    };
  } | UnauthorizedError;
}