import "@typespec/http";

namespace RestaurantApi;

using Http;

model PaginationQuery {
  @query page?: int32 = 1;
  @query pageSize?: int32 = 20;
}

model PaginatedResponse<T> {
  items: T[];
  total: int32;
  page: int32;
  pageSize: int32;
}

model ApiResponse<T> {
  data: T;
}

model ErrorResponse {
  code: string;
  message: string;
}
