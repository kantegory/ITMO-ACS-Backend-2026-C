import { Response, NextFunction } from 'express';

import { RequestWithUser } from './auth.middleware';
import { Role } from '../models/enums/role.enum';
import { isRestaurantAdmin } from '../services/restaurant-access.service';

// Копия лр1/src/middlewares/restaurant-admin.middleware.ts. Годится только для
// маршрутов вида /restaurants/:restaurantId/... — restaurantId берётся из пути.
const restaurantAdminMiddleware = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const { user } = request;
    const restaurantId = Number(request.params.restaurantId);

    if (user.role === Role.ADMIN) {
        return next();
    }

    if (
        user.role === Role.RESTAURANT_ADMIN &&
        (await isRestaurantAdmin(user.id, restaurantId))
    ) {
        return next();
    }

    return response
        .status(403)
        .send({ message: 'Forbidden: insufficient permissions' });
};

export default restaurantAdminMiddleware;
