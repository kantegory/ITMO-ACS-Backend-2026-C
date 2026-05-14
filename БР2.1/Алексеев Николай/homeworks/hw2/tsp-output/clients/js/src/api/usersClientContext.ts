import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface UsersClientContext extends Client {

}export interface UsersClientOptions extends ClientOptions {
  endpoint?: string;
}export function createUsersClientContext(
  endpoint: string,
  options?: UsersClientOptions,
): UsersClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options
  })
}
