import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

// Защита внутреннего API (раздел 7 CLAUDE.md): вызовы между сервисами несут
// заголовок X-Internal-Token с общим ключом вместо JWT. Неверный или отсутствующий
// ключ — 401 с тем же текстом, что в примере ответа docs/openapi-internal.yaml.
const internalTokenMiddleware = (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const token = request.headers['x-internal-token'];

    if (!token || token !== SETTINGS.INTERNAL_API_KEY) {
        return response
            .status(401)
            .send({ statusCode: 401, message: 'Неверный внутренний ключ' });
    }

    next();
};

export default internalTokenMiddleware;
