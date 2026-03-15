import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

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
    const { headers } = request;
    const { authorization } = headers;

    if (!authorization || typeof authorization !== 'string') {
        return response
            .status(401)
            .send({ message: 'Не авторизован: токен не передан', code: 'UNAUTHORIZED' });
    }

    try {
        const [tokenType, accessToken] = authorization.split(' ');

        if (!accessToken || tokenType !== 'Bearer') {
            return response
                .status(401)
                .send({ message: 'Не авторизован: токен не передан', code: 'UNAUTHORIZED' });
        }

        const { user }: JwtPayloadWithUser = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        request.user = user;

        next();
    } catch (error) {
        console.error(error);

        return response
            .status(401)
            .send({ message: 'Не авторизован: токен недействителен или истек', code: 'UNAUTHORIZED' });
    }
};

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
