import "@typespec/http";

using TypeSpec.Http;

@service(#{
  title: "Rent Service - Internal API"
})
@server("http://rent-service:8004/internal")
@useAuth(BearerAuth)
@tag("Rents")
namespace RentService.Internal;
alias BearerAuth = Http.BearerAuth;
enum RentStatus {
  ongoing,
  closed,
}

enum UserRoleFilter {
  tenant,
  landlord,
  both,
}

model RentReference {
  id: int32;
  tenant_id: int32;
  landlord_id: int32;
  accom_id: int32;
  start_date: utcDateTime;
  end_date: utcDateTime;
  rent_status: RentStatus;
  created_at: utcDateTime;
}

model RentIds {
  ids: int32[];
}

model RentList {
  rents: RentReference[];
}

model CreateRentRequest {
  tenant_id: int32;
  accom_id: int32;
  start_date: utcDateTime;
  end_date: utcDateTime;
}

model CreateRentResponse {
  rent: RentReference;
  success: boolean;
}

model RentValidationRequest {
  accom_id: int32;
  start_date: utcDateTime;
  end_date: utcDateTime;
}

model RentValidationResponse {
  valid: boolean;
  message: string;
  conflicting_rents: RentReference[];
}

model UpdateRentStatusRequest {
  rent_status: RentStatus;
}

model ErrorResponse {
  status: int32;
  message: string;
  timestamp: utcDateTime;
}

@route("/rents")
interface Rents {
  @get
  @route("/batch")
  batchGetRents(
    @body body: RentIds
  ): {
    @statusCode _: 200;
    @body body: RentList;
  } | {
    @statusCode _: 401;
    @body body: ErrorResponse;
  };

  @get
  @route("/{id}")
  getRent(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: RentReference;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @post
  @route("")
  createRent(
    @body body: CreateRentRequest
  ): {
    @statusCode _: 201;
    @body body: CreateRentResponse;
  } | {
    @statusCode _: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode _: 409;
    @body body: ErrorResponse;
  };

  @get
  @route("/validate")
  validateRentDates(
    @body body: RentValidationRequest
  ): {
    @statusCode _: 200;
    @body body: RentValidationResponse;
  };

  @get
  @route("/accommodation/{accomId}/active")
  getActiveRentsByAccommodation(
    @path accomId: int32
  ): {
    @statusCode _: 200;
    @body body: RentList;
  };

  @get
  @route("/user/{userId}")
  getRentsByUser(
    @path userId: int32,
    @query role?: UserRoleFilter = UserRoleFilter.both
  ): {
    @statusCode _: 200;
    @body body: RentList;
  };

  @patch
  @route("/{id}/status")
  updateRentStatus(
    @path id: int32,
    @body body: UpdateRentStatusRequest
  ): {
    @statusCode _: 200;
    @body body: RentReference;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };
}