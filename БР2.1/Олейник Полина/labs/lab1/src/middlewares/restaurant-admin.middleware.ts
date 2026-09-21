import { Response, NextFunction } from 'express';

import { RequestWithUser } from './auth.middleware';
import { Role } from '../models/enums/role.enum';
import { isRestaurantAdmin } from '../services/restaurant-access.service';

// Похож на roles.middleware.ts, но проверяет более узкое условие:
// "ADMIN системы ИЛИ администратор ИМЕННО этого ресторана" — а не просто роль.
// restaurantId берём из параметра пути (request.params.restaurantId), поэтому
// этот middleware годится только для маршрутов вида /restaurants/:restaurantId/....
const restaurantAdminMiddleware = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const { user } = request;
    const restaurantId = Number(request.params.restaurantId); // параметр пути — всегда строка, приводим к числу

    if (user.role === Role.ADMIN) {
        return next(); // ADMIN может управлять любым рестораном
    }

    if (
        user.role === Role.RESTAURANT_ADMIN &&
        (await isRestaurantAdmin(user.id, restaurantId)) // проверяем именно связь с ЭТИМ рестораном
    ) {
        return next();
    }

    return response
        .status(403)
        .send({ message: 'Forbidden: insufficient permissions' });
};

export default restaurantAdminMiddleware;
