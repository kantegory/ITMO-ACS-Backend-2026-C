import { type AuthClientContext, type AuthClientOptions, createAuthClientContext } from "./api/authClient/authClientContext.js";
import { login, type LoginOptions, logout, type LogoutOptions, refresh, type RefreshOptions, register, type RegisterOptions } from "./api/authClient/authClientOperations.js";
import { type CommentsClientContext, type CommentsClientOptions, createCommentsClientContext } from "./api/commentsClient/commentsClientContext.js";
import { addComment, type AddCommentOptions, deleteComment, type DeleteCommentOptions, listComments, type ListCommentsOptions } from "./api/commentsClient/commentsClientOperations.js";
import { createFoodSourceClientContext, type FoodSourceClientContext, type FoodSourceClientOptions } from "./api/foodSourceClientContext.js";
import { createInteractionsClientContext, type InteractionsClientContext, type InteractionsClientOptions } from "./api/interactionsClient/interactionsClientContext.js";
import { dislikeRecipe, type DislikeRecipeOptions, likeRecipe, type LikeRecipeOptions, saveRecipe, type SaveRecipeOptions, undislikeRecipe, type UndislikeRecipeOptions, unlikeRecipe, type UnlikeRecipeOptions, unsaveRecipe, type UnsaveRecipeOptions } from "./api/interactionsClient/interactionsClientOperations.js";
import { createRecipesClientContext, type RecipesClientContext, type RecipesClientOptions } from "./api/recipesClient/recipesClientContext.js";
import { createRecipe, type CreateRecipeOptions, deleteRecipe, type DeleteRecipeOptions, getRecipe, type GetRecipeOptions, listRecipes, type ListRecipesOptions, publishRecipe, type PublishRecipeOptions, updateRecipe, type UpdateRecipeOptions } from "./api/recipesClient/recipesClientOperations.js";
import { createUsersClientContext, type UsersClientContext, type UsersClientOptions } from "./api/usersClient/usersClientContext.js";
import { getDislikedRecipes, type GetDislikedRecipesOptions, getLikedRecipes, type GetLikedRecipesOptions, getMe, type GetMeOptions, getMyRecipes, type GetMyRecipesOptions, getMySubscriptions, type GetMySubscriptionsOptions, getSavedRecipes, type GetSavedRecipesOptions, getUserById, type GetUserByIdOptions, getUserRecipes, type GetUserRecipesOptions, subscribe, type SubscribeOptions, unsubscribe, type UnsubscribeOptions, updateMe, type UpdateMeOptions } from "./api/usersClient/usersClientOperations.js";
import type { CreateRecipe, Recipe, User } from "./models/models.js";

export class FoodSourceClient {
  #context: FoodSourceClientContext
  authClient: AuthClient;
  commentsClient: CommentsClient;
  interactionsClient: InteractionsClient;
  recipesClient: RecipesClient;
  usersClient: UsersClient
  constructor(options?: FoodSourceClientOptions) {
    this.#context = createFoodSourceClientContext(options);
    this.authClient = new AuthClient(options);;this
      .commentsClient = new CommentsClient(options);;this
      .interactionsClient = new InteractionsClient(options);;this
      .recipesClient = new RecipesClient(options);;this
      .usersClient = new UsersClient(options);
  }
}
export class UsersClient {
  #context: UsersClientContext
  constructor(options?: UsersClientOptions) {
    this.#context = createUsersClientContext(options);

  }
  async getMe(authorization: string, options?: GetMeOptions) {
    return getMe(this.#context, authorization, options);
  };
  async updateMe(authorization: string, body: User, options?: UpdateMeOptions) {
    return updateMe(this.#context, authorization, body, options);
  };
  async getMySubscriptions(
    authorization: string,
    options?: GetMySubscriptionsOptions,
  ) {
    return getMySubscriptions(this.#context, authorization, options);
  };
  async getSavedRecipes(
    authorization: string,
    options?: GetSavedRecipesOptions,
  ) {
    return getSavedRecipes(this.#context, authorization, options);
  };
  async getLikedRecipes(
    authorization: string,
    options?: GetLikedRecipesOptions,
  ) {
    return getLikedRecipes(this.#context, authorization, options);
  };
  async getDislikedRecipes(
    authorization: string,
    options?: GetDislikedRecipesOptions,
  ) {
    return getDislikedRecipes(this.#context, authorization, options);
  };
  async getMyRecipes(authorization: string, options?: GetMyRecipesOptions) {
    return getMyRecipes(this.#context, authorization, options);
  };
  async getUserById(userId: number, options?: GetUserByIdOptions) {
    return getUserById(this.#context, userId, options);
  };
  async getUserRecipes(userId: number, options?: GetUserRecipesOptions) {
    return getUserRecipes(this.#context, userId, options);
  };
  async subscribe(
    authorization: string,
    authorId: number,
    options?: SubscribeOptions,
  ) {
    return subscribe(this.#context, authorization, authorId, options);
  };
  async unsubscribe(
    authorization: string,
    authorId: number,
    options?: UnsubscribeOptions,
  ) {
    return unsubscribe(this.#context, authorization, authorId, options);
  }
}
export class RecipesClient {
  #context: RecipesClientContext
  constructor(options?: RecipesClientOptions) {
    this.#context = createRecipesClientContext(options);

  }
  async listRecipes(options?: ListRecipesOptions) {
    return listRecipes(this.#context, options);
  };
  async getRecipe(recipeId: number, options?: GetRecipeOptions) {
    return getRecipe(this.#context, recipeId, options);
  };
  async createRecipe(
    authorization: string,
    body: CreateRecipe,
    options?: CreateRecipeOptions,
  ) {
    return createRecipe(this.#context, authorization, body, options);
  };
  async updateRecipe(
    authorization: string,
    recipeId: number,
    body: Recipe,
    options?: UpdateRecipeOptions,
  ) {
    return updateRecipe(this.#context, authorization, recipeId, body, options);
  };
  async deleteRecipe(
    authorization: string,
    recipeId: number,
    options?: DeleteRecipeOptions,
  ) {
    return deleteRecipe(this.#context, authorization, recipeId, options);
  };
  async publishRecipe(
    authorization: string,
    recipeId: number,
    options?: PublishRecipeOptions,
  ) {
    return publishRecipe(this.#context, authorization, recipeId, options);
  }
}
export class InteractionsClient {
  #context: InteractionsClientContext
  constructor(options?: InteractionsClientOptions) {
    this.#context = createInteractionsClientContext(options);

  }
  async likeRecipe(
    authorization: string,
    recipeId: number,
    options?: LikeRecipeOptions,
  ) {
    return likeRecipe(this.#context, authorization, recipeId, options);
  };
  async unlikeRecipe(
    authorization: string,
    recipeId: number,
    options?: UnlikeRecipeOptions,
  ) {
    return unlikeRecipe(this.#context, authorization, recipeId, options);
  };
  async dislikeRecipe(
    authorization: string,
    recipeId: number,
    options?: DislikeRecipeOptions,
  ) {
    return dislikeRecipe(this.#context, authorization, recipeId, options);
  };
  async undislikeRecipe(
    authorization: string,
    recipeId: number,
    options?: UndislikeRecipeOptions,
  ) {
    return undislikeRecipe(this.#context, authorization, recipeId, options);
  };
  async saveRecipe(
    authorization: string,
    recipeId: number,
    options?: SaveRecipeOptions,
  ) {
    return saveRecipe(this.#context, authorization, recipeId, options);
  };
  async unsaveRecipe(
    authorization: string,
    recipeId: number,
    options?: UnsaveRecipeOptions,
  ) {
    return unsaveRecipe(this.#context, authorization, recipeId, options);
  }
}
export class CommentsClient {
  #context: CommentsClientContext
  constructor(options?: CommentsClientOptions) {
    this.#context = createCommentsClientContext(options);

  }
  async listComments(recipeId: number, options?: ListCommentsOptions) {
    return listComments(this.#context, recipeId, options);
  };
  async addComment(
    authorization: string,
    recipeId: number,
    body: {
        text: string;
      },
    options?: AddCommentOptions,
  ) {
    return addComment(this.#context, authorization, recipeId, body, options);
  };
  async deleteComment(
    authorization: string,
    commentId: number,
    options?: DeleteCommentOptions,
  ) {
    return deleteComment(this.#context, authorization, commentId, options);
  }
}
export class AuthClient {
  #context: AuthClientContext
  constructor(options?: AuthClientOptions) {
    this.#context = createAuthClientContext(options);

  }
  async register(
    login: string,
    email: string,
    password: string,
    confPassword: string,
    options?: RegisterOptions,
  ) {
    return register(
      this.#context,
      login,
      email,
      password,
      confPassword,
      options
    );
  };
  async login(login: string, password: string, options?: LoginOptions) {
    return login(this.#context, login, password, options);
  };
  async logout(authorization: string, options?: LogoutOptions) {
    return logout(this.#context, authorization, options);
  };
  async refresh(
    body: {
        refreshToken: string;
      },
    options?: RefreshOptions,
  ) {
    return refresh(this.#context, body, options);
  }
}
