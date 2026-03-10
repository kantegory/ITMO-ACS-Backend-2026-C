import { createRecipesClientContext, type RecipesClientContext, type RecipesClientOptions } from "./api/recipesClientContext.js";
import { createRecipe, type CreateRecipeOptions, deleteRecipe, type DeleteRecipeOptions, getRecipe, type GetRecipeOptions, listRecipes, type ListRecipesOptions, publishRecipe, type PublishRecipeOptions, updateRecipe, type UpdateRecipeOptions } from "./api/recipesClientOperations.js";
import type { Recipe } from "./models/models.js";

export class RecipesClient {
  #context: RecipesClientContext
  constructor(endpoint: string, options?: RecipesClientOptions) {
    this.#context = createRecipesClientContext(endpoint, options);

  }
  async listRecipes(options?: ListRecipesOptions) {
    return listRecipes(this.#context, options);
  };
  async getRecipe(recipeId: number, options?: GetRecipeOptions) {
    return getRecipe(this.#context, recipeId, options);
  };
  async createRecipe(
    authorization: string,
    body: createRecipe,
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
