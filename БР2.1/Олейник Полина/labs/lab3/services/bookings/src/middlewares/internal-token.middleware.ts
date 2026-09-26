import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

// Копия services/auth и services/restaurants — защищает собственные внутренние
// эндпоинты bookings (раздел 7 CLAUDE.md).
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
