import "../models/menuItem.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantApi;

@tag("Menu")
@route("/api/v1/restaurants/{restaurantId}/menu")
interface MenuApi {

  @get
  listMenu(
    @path restaurantId: string,
    @query categoryIds?: string
  ): ApiResponse<MenuItem[]>;

  @post
  createMenuItem(
    @path restaurantId: string,
    @body body: CreateMenuItemDto
  ): ApiResponse<MenuItem>
    | UnauthorizedError
    | ValidationError;
}