import "../models/restaurant.tsp";
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
    @query priceLevel?: PriceLevel
  ): ApiResponse<PaginatedResponse<Restaurant>>;

  @get
  @route("/{id}")
  getRestaurant(@path id: string):
    ApiResponse<Restaurant>
    | NotFoundError
    | InternalServerError;

  @post
  createRestaurant(
    @body body: CreateRestaurantDto
  ): ApiResponse<Restaurant>
    | UnauthorizedError
    | ForbiddenError
    | ValidationError
    | InternalServerError;
}