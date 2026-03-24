import { parse } from "uri-template";
import type { AuthClientContext } from "./authClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonConflictErrorToApplicationTransform, jsonUnauthorizedErrorToApplicationTransform, jsonUserToApplicationTransform, jsonValidationErrorToApplicationTransform } from "../../models/internal/serializers.js";
import type { ConflictError, UnauthorizedError, User, ValidationError } from "../../models/models.js";

export interface RegisterOptions extends OperationOptions {}
export async function register(
  client: AuthClientContext,
  login: string,
  email: string,
  password: string,
  confPassword: string,
  options?: RegisterOptions,
): Promise<{
  user: User;
  accessToken: string;
  refreshToken?: string;
} | UnauthorizedError | ConflictError | ValidationError> {
  const path = parse("/auth/register").expand({});
  const httpRequestOptions = {
    headers: {},body: {
      login: login,email: email,password: password,confPassword: confPassword
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      user: jsonUserToApplicationTransform(response.body.user),accessToken: response.body.accessToken,refreshToken: response.body.refreshToken
    }!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonConflictErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonValidationErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface LoginOptions extends OperationOptions {}
export async function login(
  client: AuthClientContext,
  login: string,
  password: string,
  options?: LoginOptions,
): Promise<{
  user: User;
  accessToken: string;
  refreshToken?: string;
} | UnauthorizedError | ValidationError> {
  const path = parse("/auth/login").expand({});
  const httpRequestOptions = {
    headers: {},body: {
      login: login,password: password
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      user: jsonUserToApplicationTransform(response.body.user),accessToken: response.body.accessToken,refreshToken: response.body.refreshToken
    }!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonValidationErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface LogoutOptions extends OperationOptions {}
export async function logout(
  client: AuthClientContext,
  authorization: string,
  options?: LogoutOptions,
): Promise<void | UnauthorizedError> {
  const path = parse("/auth/logout").expand({});
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface RefreshOptions extends OperationOptions {}
export async function refresh(
  client: AuthClientContext,
  body: {
      refreshToken: string;
    },
  options?: RefreshOptions,
): Promise<{
  accessToken: string;
  refreshToken?: string;
} | UnauthorizedError> {
  const path = parse("/auth/refresh").expand({});
  const httpRequestOptions = {
    headers: {},body: {
      refreshToken: body.refreshToken
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      accessToken: response.body.accessToken,refreshToken: response.body.refreshToken
    }!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUnauthorizedErrorToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
