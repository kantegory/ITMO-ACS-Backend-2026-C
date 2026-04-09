import { parse } from "uri-template";
import type { CommentsClientContext } from "./commentsClientContext.js";
import { createRestError } from "../helpers/error.js";
import type { OperationOptions } from "../helpers/interfaces.js";
import { jsonCommentToApplicationTransform, jsonForbiddenErrorToApplicationTransform, jsonNotFoundErrorToApplicationTransform, jsonPageToApplicationTransform, jsonUnauthorizedErrorToApplicationTransform, jsonValidationErrorToApplicationTransform } from "../models/internal/serializers.js";
import type { Comment, ForbiddenError, NotFoundError, Page, UnauthorizedError, ValidationError } from "../models/models.js";

export interface ListCommentsOptions extends OperationOptions {
  page?: number
  limit?: number
}
export async function listComments(
  client: CommentsClientContext,
  recipeId: number,
  options?: ListCommentsOptions,
): Promise<Page | NotFoundError> {
  const path = parse("/recipes/{recipeId}/comments{?page,limit}").expand({
    recipeId: recipeId,
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
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface AddCommentOptions extends OperationOptions {}
export async function addComment(
  client: CommentsClientContext,
  authorization: string,
  recipeId: number,
  body: {
      text: string;
    },
  options?: AddCommentOptions,
): Promise<Comment | UnauthorizedError | NotFoundError | ValidationError> {
  const path = parse("/recipes/{recipeId}/comments").expand({
    recipeId: recipeId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: {
      text: body.text
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonCommentToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonNotFoundErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonValidationErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface DeleteCommentOptions extends OperationOptions {}
export async function deleteComment(
  client: CommentsClientContext,
  authorization: string,
  commentId: number,
  options?: DeleteCommentOptions,
): Promise<void | UnauthorizedError | NotFoundError | ForbiddenError> {
  const path = parse("/recipes/comments/{commentId}").expand({
    commentId: commentId
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
