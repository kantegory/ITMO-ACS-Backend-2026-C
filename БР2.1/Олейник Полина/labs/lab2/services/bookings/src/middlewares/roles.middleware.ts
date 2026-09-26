import { Response, NextFunction } from 'express';

import { RequestWithUser } from './auth.middleware';
import { Role } from '../models/enums/role.enum';

// Копия лр1/src/middlewares/roles.middleware.ts. Используется вместе с authMiddleware:
// @UseBefore(authMiddleware, requireRole(Role.ADMIN)) — появится в профильном этапе.
function requireRole(...roles: Role[]) {
    return (request: RequestWithUser, response: Response, next: NextFunction) => {
        const userRole = request.user?.role;

        if (!userRole || !roles.includes(userRole)) {
            return response
                .status(403)
                .send({ message: 'Forbidden: insufficient permissions' });
        }

        next();
    };
}

export default requireRole;
