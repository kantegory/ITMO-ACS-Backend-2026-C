import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface RecipesClientContext extends Client {

}export interface RecipesClientOptions extends ClientOptions {
  endpoint?: string;
}export function createRecipesClientContext(
  options?: RecipesClientOptions,
): RecipesClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "/"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options
  })
}
