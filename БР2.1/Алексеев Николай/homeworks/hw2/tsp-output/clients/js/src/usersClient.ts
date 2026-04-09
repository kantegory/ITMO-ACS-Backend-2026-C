import { createUsersClientContext, type UsersClientContext, type UsersClientOptions } from "./api/usersClientContext.js";
import { getDislikedRecipes, type GetDislikedRecipesOptions, getLikedRecipes, type GetLikedRecipesOptions, getMe, type GetMeOptions, getMyRecipes, type GetMyRecipesOptions, getMySubscriptions, type GetMySubscriptionsOptions, getSavedRecipes, type GetSavedRecipesOptions, getUserById, type GetUserByIdOptions, getUserRecipes, type GetUserRecipesOptions, subscribe, type SubscribeOptions, unsubscribe, type UnsubscribeOptions, updateMe, type UpdateMeOptions } from "./api/usersClientOperations.js";
import type { User } from "./models/models.js";

export class UsersClient {
  #context: UsersClientContext
  constructor(endpoint: string, options?: UsersClientOptions) {
    this.#context = createUsersClientContext(endpoint, options);

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
