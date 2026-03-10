import { parse } from "uri-template";
import type { RecipesClientContext } from "./recipesClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonArrayStringToTransportTransform, jsonConflictErrorToApplicationTransform, jsonCreateRecipeToTransportTransform, jsonForbiddenErrorToApplicationTransform, jsonNotFoundErrorToApplicationTransform, jsonPageToApplicationTransform_2 as jsonPageToApplicationTransform, jsonRecipeToApplicationTransform, jsonRecipeToTransportTransform, jsonUnauthorizedErrorToApplicationTransform, jsonValidationErrorToApplicationTransform } from "../../models/internal/serializers.js";
import type { ConflictError, CreateRecipe, ForbiddenError, NotFoundError, Page_2 as Page, Recipe, UnauthorizedError, ValidationError } from "../../models/models.js";

export interface ListRecipesOptions extends OperationOptions {
  ingredients?: Array<string>
  typeId?: number
  cuisineId?: number
  search?: string
  page?: number
  limit?: number
}
export async function listRecipes(
  client: RecipesClientContext,
  options?: ListRecipesOptions,
): Promise<Page> {
  const path = parse("/recipes{?ingredients,typeId,cuisineId,search,page,limit}").expand({
    ...(options?.ingredients && {ingredients: jsonArrayStringToTransportTransform(options.ingredients)}),
    ...(options?.typeId && {typeId: options.typeId}),
    ...(options?.cuisineId && {cuisineId: options.cuisineId}),
    ...(options?.search && {search: options.search}),
    ...(options?.page && {page: options.page}),
    ...(options?.limit && {limit: options.limit})
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPageToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetRecipeOptions extends OperationOptions {}
export async function getRecipe(
  client: RecipesClientContext,
  recipeId: number,
  options?: GetRecipeOptions,
): Promise<Recipe | NotFoundError> {
  const path = parse("/recipes/{recipeId}").expand({
    recipeId: recipeId
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonRecipeToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateRecipeOptions extends OperationOptions {}
export async function createRecipe(
  client: RecipesClientContext,
  authorization: string,
  body: CreateRecipe,
  options?: CreateRecipeOptions,
): Promise<Recipe | UnauthorizedError | ValidationError | ConflictError> {
  const path = parse("/recipes").expand({});
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateRecipeToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonRecipeToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonValidationErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonConflictErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UpdateRecipeOptions extends OperationOptions {}
export async function updateRecipe(
  client: RecipesClientContext,
  authorization: string,
  recipeId: number,
  body: Recipe,
  options?: UpdateRecipeOptions,
): Promise<Recipe | UnauthorizedError | NotFoundError | ForbiddenError | ValidationError> {
  const path = parse("/recipes/{recipeId}").expand({
    recipeId: recipeId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonRecipeToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonRecipeToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonForbiddenErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonValidationErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface DeleteRecipeOptions extends OperationOptions {}
export async function deleteRecipe(
  client: RecipesClientContext,
  authorization: string,
  recipeId: number,
  options?: DeleteRecipeOptions,
): Promise<void | UnauthorizedError | NotFoundError | ForbiddenError> {
  const path = parse("/recipes/{recipeId}").expand({
    recipeId: recipeId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).delete(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonForbiddenErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface PublishRecipeOptions extends OperationOptions {}
export async function publishRecipe(
  client: RecipesClientContext,
  authorization: string,
  recipeId: number,
  options?: PublishRecipeOptions,
): Promise<Recipe | UnauthorizedError | NotFoundError | ForbiddenError> {
  const path = parse("/recipes/{recipeId}/publish").expand({
    recipeId: recipeId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonRecipeToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonForbiddenErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
