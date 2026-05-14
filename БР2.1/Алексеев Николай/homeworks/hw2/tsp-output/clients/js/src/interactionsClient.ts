import { createInteractionsClientContext, type InteractionsClientContext, type InteractionsClientOptions } from "./api/interactionsClientContext.js";
import { dislikeRecipe, type DislikeRecipeOptions, likeRecipe, type LikeRecipeOptions, saveRecipe, type SaveRecipeOptions, undislikeRecipe, type UndislikeRecipeOptions, unlikeRecipe, type UnlikeRecipeOptions, unsaveRecipe, type UnsaveRecipeOptions } from "./api/interactionsClientOperations.js";

export class InteractionsClient {
  #context: InteractionsClientContext
  constructor(endpoint: string, options?: InteractionsClientOptions) {
    this.#context = createInteractionsClientContext(endpoint, options);

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
