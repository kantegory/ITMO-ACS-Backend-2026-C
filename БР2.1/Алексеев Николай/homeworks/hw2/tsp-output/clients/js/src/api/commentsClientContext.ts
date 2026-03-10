import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface CommentsClientContext extends Client {

}export interface CommentsClientOptions extends ClientOptions {
  endpoint?: string;
}export function createCommentsClientContext(
  endpoint: string,
  options?: CommentsClientOptions,
): CommentsClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options
  })
}
