import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

interface JwtPayloadWithUser extends JwtPayload {
    user: {
        id: number;
        type: string;
    };
}

interface RequestWithUser extends Request {
    user: JwtPayloadWithUser['user'];
}

const authMiddleware = (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const authorization = request.headers.authorization;

    if (!authorization) {
        return response
            .status(401)
            .send({ message: 'Unauthorized: no token provided' });
    }

    try {
        const [, accessToken] = authorization.split(' ');

        if (!accessToken) {
            return response
                .status(401)
                .send({ message: 'Unauthorized: no token provided' });
        }

        const { user }: JwtPayloadWithUser = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        request.user = user;

        next();
    } catch {
        return response
            .status(403)
            .send({ message: 'Forbidden: token is invalid or expired' });
    }
};

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
