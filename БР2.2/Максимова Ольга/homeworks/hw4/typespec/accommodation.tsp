import "@typespec/http";

using TypeSpec.Http;

@service(#{
  title: "Accommodation Service - Internal API"
})
@server("http://accommodation-service:8002/internal")
@useAuth(BearerAuth)
@tag("Accommodations")
namespace AccommodationService.Internal;

alias BearerAuth = Http.BearerAuth;

enum AccommodationType {
  flat,
  house,
  room,
  townhouse,
  dacha,
}

model Address {
  city: string;
  district: string;
  street: string;
  house_num: string;
}

model AccommodationReference {
  id: int32;
  title: string;
  accom_type: AccommodationType;
  rooms_num: int32;
  price: float32;
  landlord_id: int32;
  is_rented: boolean;
  is_published: boolean;
  address: Address;
}

model AccommodationIds {
  ids: int32[];
}

model AccommodationList {
  accommodations: AccommodationReference[];
}

model AvailabilityCheck {
  accom_id: int32;
  start_date: utcDateTime;
  end_date: utcDateTime;
}

model AvailabilityResponse {
  available: boolean;
  message: string;
}

model RentTerms {
  price: float32;
  deposit: float32;
  commission: float32;
  util_serv_pay: string;

  with_kids: boolean;
  with_pets: boolean;
}

model UpdateStatusRequest {
  is_rented: boolean;
}

model ErrorResponse {
  status: int32;
  message: string;
  timestamp: utcDateTime;
}

@route("/accommodations")
interface Accommodations {
  @get
  @route("/batch")
  batchGetAccommodations(
    @body body: AccommodationIds
  ): {
    @statusCode _: 200;
    @body body: AccommodationList;
  } | {
    @statusCode _: 401;
    @body body: ErrorResponse;
  };

  @get
  @route("/{id}")
  getAccommodation(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: AccommodationReference;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };


  @get
  @route("/{id}/availability")
  checkAvailability(
    @path id: int32,
    @body body: AvailabilityCheck
  ): {
    @statusCode _: 200;
    @body body: AvailabilityResponse;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @get
  @route("/{id}/rent-terms")
  getRentTerms(
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: RentTerms;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @get
  @route("/landlord/{landlordId}")
  getAccommodationsByLandlord(
    @path landlordId: int32,
    @query published_only?: boolean = false
  ): {
    @statusCode _: 200;
    @body body: AccommodationList;
  };


  @patch
  @route("/{id}/update-status")
  updateAccommodationStatus(
    @path id: int32,
    @body body: UpdateStatusRequest
  ): {
    @statusCode _: 200;
  } | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode _: 403;
    @body body: ErrorResponse;
  };
}