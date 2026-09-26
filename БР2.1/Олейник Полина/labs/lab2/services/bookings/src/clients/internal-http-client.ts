import SETTINGS from '../config/settings';
import { ServiceUnavailableError, GatewayTimeoutError } from '../errors/http-errors';

const TIMEOUT_MS = 3000; // раздел 7 CLAUDE.md

interface InternalRequestOptions {
    method?: 'GET' | 'POST' | 'PATCH';
    body?: unknown;
}

// Копия services/restaurants/src/clients/internal-http-client.ts. Таймаут 3с,
// заголовок X-Internal-Token, GET повторяется один раз при сбое, POST/PATCH — нет.
// Нет соединения или 5xx -> ServiceUnavailableError (503), таймаут -> GatewayTimeoutError (504).
async function callInternal(
    url: string,
    options: InternalRequestOptions = {},
): Promise<Response> {
    const method = options.method ?? 'GET';
    const maxAttempts = method === 'GET' ? 2 : 1;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'X-Internal-Token': SETTINGS.INTERNAL_API_KEY,
                    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (response.status >= 500) {
                lastError = new ServiceUnavailableError();
                continue;
            }

            return response;
        } catch (error: any) {
            clearTimeout(timer);
            lastError =
                error?.name === 'AbortError'
                    ? new GatewayTimeoutError()
                    : new ServiceUnavailableError();
        }
    }

    throw lastError;
}

export { callInternal };
