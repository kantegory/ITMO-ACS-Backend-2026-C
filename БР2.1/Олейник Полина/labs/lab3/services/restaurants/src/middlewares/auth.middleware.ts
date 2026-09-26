import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

// Копия лр1/src/middlewares/auth.middleware.ts. Ещё не подключена ни к одному маршруту —
// контроллеры появятся в профильном этапе, тогда middleware будет использоваться через @UseBefore.
interface JwtPayloadWithUser extends JwtPayload {
    user: any;
}

interface RequestWithUser extends Request {
    user: any;
}

const authMiddleware = (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const { authorization } = request.headers;

    if (!authorization) {
        return response
            .status(401)
            .send({ message: 'Unauthorized: no token provided' });
    }

    const [, accessToken] = authorization.split(' ');

    if (!accessToken) {
        return response
            .status(401)
            .send({ message: 'Unauthorized: no token provided' });
    }

    try {
        const { user }: JwtPayloadWithUser = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        request.user = user;

        next();
    } catch (error) {
        return response
            .status(401)
            .send({ message: 'Unauthorized: token is invalid or expired' });
    }
};

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
