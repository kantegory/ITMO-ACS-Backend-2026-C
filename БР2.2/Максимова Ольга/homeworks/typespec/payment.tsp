import "@typespec/http";

using TypeSpec.Http;

@service(#{
  title: "Payment Service - Internal API"
})
@server("http://payment-service:8003/internal")
@useAuth(BearerAuth)
@tag("Payments")
namespace PaymentService.Internal;

alias BearerAuth = Http.BearerAuth;
enum PaymentStatus {
  successful,
  pending,
  failed,
}

enum PaymentMethod {
  card,
  bank_transfer,
  cash,
}

model PaymentReference {
  id: int32;
  rent_id: int32;
  amount: float32;
  status: PaymentStatus;
  created_at: utcDateTime;
}

model PaymentIds {
  ids: int32[];
}

model PaymentList {
  payments: PaymentReference[];
}

model CreatePaymentRequest {
  rent_id: int32;
  amount: float32;
}

model CreatePaymentResponse {
  payment: PaymentReference;
  transaction_id: string;
}

model PaymentVerificationRequest {
  rent_id: int32;
  expected_amount: float32;
}

model PaymentVerificationResponse {
  verified: boolean;
  total_paid: float32;
  pending_amount: float32;
  payments: PaymentReference[];
}

model ProcessPaymentRequest {
  payment_method: PaymentMethod;
}


model ErrorResponse {
  status: int32;
  message: string;
  timestamp: utcDateTime;
}

@route("/payments")
interface Payments {
  @get
  @route("/batch")
  batchGetPayments(
    @body body: PaymentIds
  ): {
    @statusCode _: 200;
    @body body: PaymentList;
  } | {
    @statusCode _: 401;
    @body body: ErrorResponse;
  };

  @get
  @route("/{id}")
  getPayment(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: PaymentReference;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @post
  @route("")
  createPayment(
    @body body: CreatePaymentRequest
  ): {
    @statusCode _: 201;
    @body body: CreatePaymentResponse;
  } | {
    @statusCode _: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @get
  @route("/rent/{rentId}")
  getPaymentsByRent(
    @path rentId: int32
  ): {
    @statusCode _: 200;
    @body body: PaymentList;
  };

  @get
  @route("/verify")
  verifyPayment(
    @body body: PaymentVerificationRequest
  ): {
    @statusCode _: 200;
    @body body: PaymentVerificationResponse;
  };

  @post
  @route("/{id}/process")
  processPayment(
    @path id: int32,
    @body body: ProcessPaymentRequest
  ): {
    @statusCode _: 200;
    @body body: PaymentReference;
  } | {
    @statusCode _: 400;
    @body body: ErrorResponse;
  };
}