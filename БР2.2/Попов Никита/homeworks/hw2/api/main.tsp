import "@typespec/openapi3";
import "@typespec/http";

import "./routes/index.tsp";

using Http;

@service(#{
  title: "Restaurant API",
})
@server("http://localhost:3000", "Local")
namespace RestaurantApi;