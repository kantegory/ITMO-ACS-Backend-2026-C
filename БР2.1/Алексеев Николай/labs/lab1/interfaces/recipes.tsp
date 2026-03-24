import "../models/recipe.tsp";
import "../models/enums.tsp";
import "../models/error.tsp";
import "../models/pagination.tsp";
import "@typespec/http";

using Http;

namespace FoodSource;

@route("/recipes")
interface Recipes {
  // Список рецептов с фильтрацией
  @get
  op listRecipes(
    @query ingredients?: string[],
    @query typeId?: int32,
    @query cuisineId?: int32,
    @query search?: string,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<recipeCard>;
  };

  // Полная информация о рецепте
  @get
  @route("{recipeId}")
  op getRecipe(@path recipeId: int32): {
    @statusCode statusCode: 200;
    @body recipe: recipe;
  } | NotFoundError;

  // Создание рецепта
  @post
  op createRecipe(
    @header authorization: string,
    @body body: createRecipe
  ): {
    @statusCode statusCode: 201;
    @body recipe: recipe;
  } | UnauthorizedError | ValidationError | ConflictError;

  // Обновление рецепта
  @patch(#{ implicitOptionality: true })
  @route("{recipeId}")
  op updateRecipe(
    @header authorization: string,
    @path recipeId: int32,
    @body body: recipe
  ): {
    @statusCode statusCode: 200;
    @body recipe: recipe;
  } | UnauthorizedError | NotFoundError | ForbiddenError | ValidationError;

  // Удаление рецепта
  @delete
  @route("{recipeId}")
  op deleteRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | NotFoundError | ForbiddenError;

  // Публикация рецепта
  @post
  @route("{recipeId}/publish")
  op publishRecipe(
    @header authorization: string,
    @path recipeId: int32
  ): {
    @statusCode statusCode: 200;
    @body recipe: recipe;
  } | UnauthorizedError | NotFoundError | ForbiddenError;
}