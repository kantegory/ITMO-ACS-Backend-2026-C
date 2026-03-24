import "../models/user.tsp";
import "../models/recipe.tsp";
import "../models/error.tsp";
import "../models/pagination.tsp";
import "@typespec/http";

using Http;

namespace FoodSource;

@route("/users")
interface Users {
  // Текущий пользователь
  @get
  @route("me")
  op getMe(@header authorization: string): {
    @statusCode statusCode: 200;
    @body user: user;
  } | UnauthorizedError | NotFoundError;

  @patch(#{ implicitOptionality: true })
  @route("me")
  op updateMe(@header authorization: string, @body body: user): {
    @statusCode statusCode: 200;
    @body user: user;
  } | UnauthorizedError | ValidationError | ConflictError;

  // Подписки текущего пользователя
  @get
  @route("me/subscriptions")
  op getMySubscriptions(
    @header authorization: string,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<subscription & { author: user }>;
  } | UnauthorizedError;

  // Сохранённые рецепты
  @get
  @route("me/saved-recipes")
  op getSavedRecipes(
    @header authorization: string,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<savedRecipe>;
  } | UnauthorizedError;

  // Оценённые рецепты (лайки)
  @get
  @route("me/liked-recipes")
  op getLikedRecipes(
    @header authorization: string,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<gradeRecipe>;
  } | UnauthorizedError;

  // Оценённые рецепты (дизлайки)
  @get
  @route("me/disliked-recipes")
  op getDislikedRecipes(
    @header authorization: string,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<gradeRecipe>;
  } | UnauthorizedError;

  // Рецепты, созданные текущим пользователем
  @get
  @route("me/recipes")
  op getMyRecipes(
    @header authorization: string,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<recipeCard>;
  } | UnauthorizedError;

  // Информация о другом пользователе
  @get
  @route("{userId}")
  op getUserById(@path userId: int32): {
    @statusCode statusCode: 200;
    @body user: user;
  } | NotFoundError;

  // Рецепты другого пользователя
  @get
  @route("{userId}/recipes")
  op getUserRecipes(
    @path userId: int32,
    @query page?: int32,
    @query limit?: int32
  ): {
    @statusCode statusCode: 200;
    @body body: Page<recipeCard>;
  } | NotFoundError;

  // Подписка на автора
  @post
  @route("{authorId}/subscribe")
  op subscribe(
    @header authorization: string,
    @path authorId: int32
  ): {
    @statusCode statusCode: 201;
    @body subscription: subscription;
  } | UnauthorizedError | NotFoundError | ConflictError;

  // Отписка от автора
  @delete
  @route("{authorId}/subscribe")
  op unsubscribe(
    @header authorization: string,
    @path authorId: int32
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | NotFoundError;
}