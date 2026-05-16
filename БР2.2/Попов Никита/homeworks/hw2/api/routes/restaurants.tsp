import "../models/restaurant.tsp";
import "../models/enum.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantApi;

@tag("Restaurant")
@route("/api/v1/restaurants")
interface RestaurantsApi {

  @get
  listRestaurants(
    ...PaginationQuery,
    @query city?: string,
    @query cuisineId?: string,
    @query priceLevel?: PriceLevel,
    @query name?: string,
    @query sortBy?: "priceLevel" | "rating" | "name" | "createdAt",
    @query sortOrder?: SortOrder
  ): ApiResponse<PaginatedResponse<Restaurant>>;

  @get
  @route("/{id}")
  getRestaurant(@path id: string):
    ApiResponse<Restaurant>
    | NotFoundError
    | InternalServerError;

  @get
  @route("/restaurants/{restaurantId}/available-slots")
  getAvailableSlots(
    @path restaurantId: string,
    @query date: utcDateTime,
    @query guestCount: int32,
    @query durationMinutes?: int32
  ): ApiResponse<AvailableSlotsResponse>
    | NotFoundError
    | ValidationError;

  @post
  createRestaurant(
    @body body: CreateRestaurantDto
  ): ApiResponse<Restaurant>
    | UnauthorizedError
    | ForbiddenError
    | ValidationError
    | InternalServerError;
}