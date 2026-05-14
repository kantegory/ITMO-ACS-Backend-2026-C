import "../models/recipe.tsp";
import "../models/error.tsp";
import "../models/pagination.tsp";
import "@typespec/http";

using Http;

namespace FoodSource;

@route("/recipes")
interface Comments {
  // Список комментариев рецепта
  @get
  @route("{recipeId}/comments")
  op listComments(
    @path recipeId: int32,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<comment>;
  } | NotFoundError;

  // Добавить комментарий
  @post
  @route("{recipeId}/comments")
  op addComment(
    @header authorization: string,
    @path recipeId: int32,
    @body body: { text: string }
  ): {
    @statusCode statusCode: 201;
    @body comment: comment;
  } | UnauthorizedError | NotFoundError | ValidationError;

  // Удалить комментарий
  @delete
  @route("/comments/{commentId}")
  op deleteComment(
    @header authorization: string,
    @path commentId: int32
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | NotFoundError | ForbiddenError;
}