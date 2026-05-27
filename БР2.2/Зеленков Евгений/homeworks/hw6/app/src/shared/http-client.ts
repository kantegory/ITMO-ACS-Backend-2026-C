import { config } from './config';
import { HttpError } from './errors';

export type ServiceRequestOptions = {
  method?: string;
  body?: unknown;
  requestId?: string;
  userId?: string;
  userRole?: string;
  timeoutMs?: number;
  serviceToken?: boolean;
};

export async function serviceRequest<T>(url: string, options: ServiceRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 2000);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json'
    };

    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.requestId) headers['X-Request-Id'] = options.requestId;
    if (options.userId) headers['X-User-Id'] = options.userId;
    if (options.userRole) headers['X-User-Role'] = options.userRole;
    if (options.serviceToken ?? true) headers['X-Service-Token'] = config.serviceToken;

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }

    if (!response.ok) {
      throw new HttpError(
        response.status,
        data?.code ?? 'dependency_error',
        data?.message ?? `Dependency returned status ${response.status}`
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HttpError(504, 'dependency_timeout', 'Dependency did not respond in time');
    }
    throw new HttpError(503, 'dependency_unavailable', 'Dependency is unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

export function downstreamHeaders(requestId?: string, userId?: string, userRole?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Service-Token': config.serviceToken
  };
  if (requestId) headers['X-Request-Id'] = requestId;
  if (userId) headers['X-User-Id'] = userId;
  if (userRole) headers['X-User-Role'] = userRole;
  return headers;
}
