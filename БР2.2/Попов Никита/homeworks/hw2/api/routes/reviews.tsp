import "../models/review.tsp";
import "../models/enum.tsp";
import "../models/error.tsp";

namespace RestaurantApi;

using Http;

@tag("Restaurant")
@route("/api/v1/restaurants/{restaurantId}/reviews")
interface ReviewsApi {

  @get
  listReviews(
    @path restaurantId: string,
    ...PaginationQuery,
    @query sortBy?: "rating" | "createdAt",
    @query sortOrder?: SortOrder
  ): ApiResponse<PaginatedResponse<Review>>;

  @post
  createReview(
    @path restaurantId: string,
    @body body: CreateReviewDto
  ): ApiResponse<Review>
    | UnauthorizedError
    | ValidationError;
}