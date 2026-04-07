import "@typespec/http";

using TypeSpec.Http;


@service(#{
  title: "User Service - Internal API"
})

@server("http://user-service:8001/internal")
@useAuth(BearerAuth)
@tag("Users")
namespace UserService.Internal;

alias BearerAuth = Http.BearerAuth;

model UserReference {
  id: int32;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user";
  is_verified: boolean;
  created_at: utcDateTime;
}

model UserIds {
  ids: int32[];
}

model UserList {
  users: UserReference[];
}

model ErrorResponse {
  status: int32;
  message: string;
  timestamp: utcDateTime;
}

model UserValidationResponse {
  valid: boolean;
  user: UserReference;
}

@route("/users")
interface Users {
  @get
  @route("/batch")
  batchGetUsers(
    @body body: UserIds
  ): {
    @statusCode _: 200;
    @body body: UserList;
  } | {
    @statusCode _: 401;
    @body body: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body body: ErrorResponse;
  };


  @get
  @route("/{id}/validate")
  validateUser(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: UserValidationResponse;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @get
  @route("/landlord/{id}")
  getLandlord(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: UserReference;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @get
  @route("/tenant/{id}")
  getTenant(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: UserReference;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };
}