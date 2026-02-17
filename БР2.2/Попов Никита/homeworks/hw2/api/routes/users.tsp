import "../models/user.tsp";
import "../models/common.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantApi;

@tag("Users")
@route("/api/v1/users")
interface UsersApi {

  @get
  @route("/me")
  getMe(): ApiResponse<User>;

  @patch
  @route("/me")
  updateMe(
    @body body: {
      firstName?: string;
      lastName?: string;
    }
  ): ApiResponse<User>;
}