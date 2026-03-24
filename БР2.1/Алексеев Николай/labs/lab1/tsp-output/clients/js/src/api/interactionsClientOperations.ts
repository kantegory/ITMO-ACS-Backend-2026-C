import { parse } from "uri-template";
import type { InteractionsClientContext } from "./interactionsClientContext.js";
import { createRestError } from "../helpers/error.js";
import type { OperationOptions } from "../helpers/interfaces.js";
import { jsonConflictErrorToApplicationTransform, jsonNotFoundErrorToApplicationTransform, jsonSavedRecipeToApplicationTransform, jsonUnauthorizedErrorToApplicationTransform } from "../models/internal/serializers.js";
import type { ConflictError, NotFoundError, SavedRecipe, UnauthorizedError } from "../models/models.js";

export interface LikeRecipeOptions extends OperationOptions {}
export async function likeRecipe(
  client: InteractionsClientContext,
  authorization: string,
  recipeId: number,
  options?: LikeRecipeOptions,
): Promise<{
  likes: number;
  dislikes: number;
} | UnauthorizedError | NotFoundError | ConflictError> {
  const path = parse("/recipes/{recipeId}/like").expand({
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
    return {
      likes: response.body.likes,dislikes: response.body.dislikes
    }!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonConflictErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UnlikeRecipeOptions extends OperationOptions {}
export async function unlikeRecipe(
  client: InteractionsClientContext,
  authorization: string,
  recipeId: number,
  options?: UnlikeRecipeOptions,
): Promise<{
  likes: number;
  dislikes: number;
} | UnauthorizedError | NotFoundError> {
  const path = parse("/recipes/{recipeId}/like").expand({
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
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      likes: response.body.likes,dislikes: response.body.dislikes
    }!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface DislikeRecipeOptions extends OperationOptions {}
export async function dislikeRecipe(
  client: InteractionsClientContext,
  authorization: string,
  recipeId: number,
  options?: DislikeRecipeOptions,
): Promise<{
  likes: number;
  dislikes: number;
} | UnauthorizedError | NotFoundError | ConflictError> {
  const path = parse("/recipes/{recipeId}/dislike").expand({
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
    return {
      likes: response.body.likes,dislikes: response.body.dislikes
    }!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonConflictErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UndislikeRecipeOptions extends OperationOptions {}
export async function undislikeRecipe(
  client: InteractionsClientContext,
  authorization: string,
  recipeId: number,
  options?: UndislikeRecipeOptions,
): Promise<{
  likes: number;
  dislikes: number;
} | UnauthorizedError | NotFoundError> {
  const path = parse("/recipes/{recipeId}/dislike").expand({
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
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      likes: response.body.likes,dislikes: response.body.dislikes
    }!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface SaveRecipeOptions extends OperationOptions {}
export async function saveRecipe(
  client: InteractionsClientContext,
  authorization: string,
  recipeId: number,
  options?: SaveRecipeOptions,
): Promise<SavedRecipe | UnauthorizedError | NotFoundError | ConflictError> {
  const path = parse("/recipes/{recipeId}/save").expand({
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
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonSavedRecipeToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonConflictErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UnsaveRecipeOptions extends OperationOptions {}
export async function unsaveRecipe(
  client: InteractionsClientContext,
  authorization: string,
  recipeId: number,
  options?: UnsaveRecipeOptions,
): Promise<void | UnauthorizedError | NotFoundError> {
  const path = parse("/recipes/{recipeId}/save").expand({
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
  throw createRestError(response);
}
;
