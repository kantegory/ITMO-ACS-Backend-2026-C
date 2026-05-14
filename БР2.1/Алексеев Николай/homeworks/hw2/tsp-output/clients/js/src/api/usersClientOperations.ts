import { parse } from "uri-template";
import type { UsersClientContext } from "./usersClientContext.js";
import { createRestError } from "../helpers/error.js";
import type { OperationOptions } from "../helpers/interfaces.js";
import { jsonConflictErrorToApplicationTransform, jsonNotFoundErrorToApplicationTransform, jsonPageToApplicationTransform_3 as jsonPageToApplicationTransform, jsonPageToApplicationTransform_4 as jsonPageToApplicationTransform_2, jsonPageToApplicationTransform_5 as jsonPageToApplicationTransform_3, jsonPageToApplicationTransform_2 as jsonPageToApplicationTransform_4, jsonSubscriptionToApplicationTransform, jsonUnauthorizedErrorToApplicationTransform, jsonUserToApplicationTransform, jsonUserToTransportTransform, jsonValidationErrorToApplicationTransform } from "../models/internal/serializers.js";
import type { ConflictError, NotFoundError, Page_3 as Page, Page_4 as Page_2, Page_5 as Page_3, Page_2 as Page_4, Subscription, UnauthorizedError, User, ValidationError } from "../models/models.js";

export interface GetMeOptions extends OperationOptions {}
export async function getMe(
  client: UsersClientContext,
  authorization: string,
  options?: GetMeOptions,
): Promise<User | UnauthorizedError | NotFoundError> {
  const path = parse("/users/me").expand({});
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUserToApplicationTransform(response.body)!;
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
export interface UpdateMeOptions extends OperationOptions {}
export async function updateMe(
  client: UsersClientContext,
  authorization: string,
  body: User,
  options?: UpdateMeOptions,
): Promise<User | UnauthorizedError | ValidationError | ConflictError> {
  const path = parse("/users/me").expand({});
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUserToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUserToApplicationTransform(response.body)!;
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
export interface GetMySubscriptionsOptions extends OperationOptions {
  page?: number
  limit?: number
}
export async function getMySubscriptions(
  client: UsersClientContext,
  authorization: string,
  options?: GetMySubscriptionsOptions,
): Promise<Page | UnauthorizedError> {
  const path = parse("/users/me/subscriptions{?page,limit}").expand({
    ...(options?.page && {page: options.page}),
    ...(options?.limit && {limit: options.limit})
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPageToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetSavedRecipesOptions extends OperationOptions {
  page?: number
  limit?: number
}
export async function getSavedRecipes(
  client: UsersClientContext,
  authorization: string,
  options?: GetSavedRecipesOptions,
): Promise<Page_2 | UnauthorizedError> {
  const path = parse("/users/me/saved-recipes{?page,limit}").expand({
    ...(options?.page && {page: options.page}),
    ...(options?.limit && {limit: options.limit})
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPageToApplicationTransform_2(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetLikedRecipesOptions extends OperationOptions {
  page?: number
  limit?: number
}
export async function getLikedRecipes(
  client: UsersClientContext,
  authorization: string,
  options?: GetLikedRecipesOptions,
): Promise<Page_3 | UnauthorizedError> {
  const path = parse("/users/me/liked-recipes{?page,limit}").expand({
    ...(options?.page && {page: options.page}),
    ...(options?.limit && {limit: options.limit})
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPageToApplicationTransform_3(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetDislikedRecipesOptions extends OperationOptions {
  page?: number
  limit?: number
}
export async function getDislikedRecipes(
  client: UsersClientContext,
  authorization: string,
  options?: GetDislikedRecipesOptions,
): Promise<Page_3 | UnauthorizedError> {
  const path = parse("/users/me/disliked-recipes{?page,limit}").expand({
    ...(options?.page && {page: options.page}),
    ...(options?.limit && {limit: options.limit})
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPageToApplicationTransform_3(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetMyRecipesOptions extends OperationOptions {
  page?: number
  limit?: number
}
export async function getMyRecipes(
  client: UsersClientContext,
  authorization: string,
  options?: GetMyRecipesOptions,
): Promise<Page_4 | UnauthorizedError> {
  const path = parse("/users/me/recipes{?page,limit}").expand({
    ...(options?.page && {page: options.page}),
    ...(options?.limit && {limit: options.limit})
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPageToApplicationTransform_4(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetUserByIdOptions extends OperationOptions {}
export async function getUserById(
  client: UsersClientContext,
  userId: number,
  options?: GetUserByIdOptions,
): Promise<User | NotFoundError> {
  const path = parse("/users/{userId}").expand({
    userId: userId
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUserToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetUserRecipesOptions extends OperationOptions {
  page?: number
  limit?: number
}
export async function getUserRecipes(
  client: UsersClientContext,
  userId: number,
  options?: GetUserRecipesOptions,
): Promise<Page_4 | NotFoundError> {
  const path = parse("/users/{userId}/recipes{?page,limit}").expand({
    userId: userId,
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
    return jsonPageToApplicationTransform_4(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface SubscribeOptions extends OperationOptions {}
export async function subscribe(
  client: UsersClientContext,
  authorization: string,
  authorId: number,
  options?: SubscribeOptions,
): Promise<Subscription | UnauthorizedError | NotFoundError | ConflictError> {
  const path = parse("/users/{authorId}/subscribe").expand({
    authorId: authorId
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
    return jsonSubscriptionToApplicationTransform(response.body)!;
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
export interface UnsubscribeOptions extends OperationOptions {}
export async function unsubscribe(
  client: UsersClientContext,
  authorization: string,
  authorId: number,
  options?: UnsubscribeOptions,
): Promise<void | UnauthorizedError | NotFoundError> {
  const path = parse("/users/{authorId}/subscribe").expand({
    authorId: authorId
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
