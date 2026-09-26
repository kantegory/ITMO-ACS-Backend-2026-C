import { Request, Response } from 'express';

const TIMEOUT_MS = 3000; // тот же ориентир, что в разделе 7 CLAUDE.md для межсервисных вызовов

// Пересылает запрос как есть на baseUrl (бэкенды сами ждут /api/v1/..., поэтому
// используется req.originalUrl целиком) и копирует ответ клиенту без изменений —
// формат ошибок бэкенда {statusCode, message, errors?} доходит нетронутым.
// Нет соединения/сетевая ошибка -> 503, таймаут -> 504 (без повтора — см. routing.ts/план).
async function forwardRequest(baseUrl: string, req: Request, res: Response): Promise<void> {
    const targetUrl = `${baseUrl}${req.originalUrl}`;

    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
    }

    let body: string | undefined;
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(req.body ?? {});
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
            signal: controller.signal,
        });
        clearTimeout(timer);

        const text = await response.text();
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        res.status(response.status).send(text);
    } catch (error: any) {
        clearTimeout(timer);

        if (error?.name === 'AbortError') {
            res.status(504).json({ statusCode: 504, message: 'Gateway timeout' });
        } else {
            res.status(503).json({ statusCode: 503, message: 'Service unavailable' });
        }
    }
}

export { forwardRequest };
