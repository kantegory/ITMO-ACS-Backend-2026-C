import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface AuthClientContext extends Client {

}export interface AuthClientOptions extends ClientOptions {
  endpoint?: string;
}export function createAuthClientContext(
  endpoint: string,
  options?: AuthClientOptions,
): AuthClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options
  })
}
