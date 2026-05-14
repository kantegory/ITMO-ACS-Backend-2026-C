import "../models/recipe.tsp";
import "../models/enums.tsp";
import "../models/error.tsp";
import "@typespec/http";

using Http;

namespace FoodSource;

@route("/recipes")
interface Interactions {
  // Лайк
  @post
  @route("{recipeId}/like")
  op likeRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 200;
    @body body: { likes: int32; dislikes: int32 };
  } | UnauthorizedError | NotFoundError | ConflictError;

  @delete
  @route("{recipeId}/like")
  op unlikeRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 200;
    @body body: { likes: int32; dislikes: int32 };
  } | UnauthorizedError | NotFoundError;

  // Дизлайк
  @post
  @route("{recipeId}/dislike")
  op dislikeRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 200;
    @body body: { likes: int32; dislikes: int32 };
  } | UnauthorizedError | NotFoundError | ConflictError;

  @delete
  @route("{recipeId}/dislike")
  op undislikeRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 200;
    @body body: { likes: int32; dislikes: int32 };
  } | UnauthorizedError | NotFoundError;

  // Сохранение
  @post
  @route("{recipeId}/save")
  op saveRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 201;
    @body saved: savedRecipe;
  } | UnauthorizedError | NotFoundError | ConflictError;

  @delete
  @route("{recipeId}/save")
  op unsaveRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | NotFoundError;
}