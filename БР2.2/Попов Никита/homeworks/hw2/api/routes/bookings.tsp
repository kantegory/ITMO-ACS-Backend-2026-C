import "../models/booking.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantApi;

@tag("Bookings")
@route("/api/v1")
interface BookingsApi {

  @get
  @route("/bookings/me")
  myBookings(...PaginationQuery):
    ApiResponse<PaginatedResponse<Booking>>
    | NotFoundError
    | UnauthorizedError;

  @post
  @route("/restaurants/{restaurantId}/bookings")
  createBooking(
    @path restaurantId: string,
    @body body: CreateBookingDto
  ): ApiResponse<Booking>
    | ValidationError
    | UnauthorizedError;

  @patch
  @route("/bookings/{id}/status")
  updateStatus(
    @path id: string,
    @body body: { status: BookingStatus }
  ): ApiResponse<Booking>
    | UnauthorizedError
    | ValidationError;
}