import "@typespec/http";
import "./interfaces/auth.tsp";
import "./interfaces/comments.tsp";
import "./interfaces/interactions.tsp";
import "./interfaces/recipes.tsp";
import "./interfaces/users.tsp";

using Http;

@service(#{title: "FoodSource"})
@server("/", "")
namespace FoodSource;