import { Response, NextFunction } from 'express';

import { RequestWithUser } from './auth.middleware';
import { Role } from '../models/enums/role.enum';

// Фабрика middleware: не сам middleware, а функция, которая ЕГО СОЗДАЁТ под нужные роли.
// Используется так: @UseBefore(authMiddleware, requireRole(Role.ADMIN)) — сначала проверяется
// токен, потом — что роль из токена входит в список разрешённых. Если нет — 403.
// requireRole(...roles) — можно передать несколько ролей через запятую, разрешён вход любой из них.
function requireRole(...roles: Role[]) {
    return (request: RequestWithUser, response: Response, next: NextFunction) => {
        const userRole = request.user?.role; // request.user появляется только после authMiddleware

        if (!userRole || !roles.includes(userRole)) {
            return response
                .status(403)
                .send({ message: 'Forbidden: insufficient permissions' });
        }

        next();
    };
}

export default requireRole;
