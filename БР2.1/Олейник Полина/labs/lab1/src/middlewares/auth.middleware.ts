import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

// Форма содержимого JWT-токена — внутри него лежит объект { user: {...} }
interface JwtPayloadWithUser extends JwtPayload {
    user: any;
}

// Обычный Express Request, дополненный полем user — его добавляет этот самый middleware,
// после чего любой контроллер, объявленный с @Req() request: RequestWithUser,
// может прочитать request.user.id / request.user.role
interface RequestWithUser extends Request {
    user: any;
}

// Middleware — функция, которая выполняется ДО контроллера и решает, пускать ли запрос дальше.
// Эта проверяет JWT-токен: если его нет или он невалиден — сразу отвечает 401,
// контроллер даже не вызывается. Если токен верный — кладёт данные пользователя
// в request.user и вызывает next(), передавая управление дальше.
const authMiddleware = (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const { authorization } = request.headers; // ожидаем заголовок вида "Authorization: Bearer <токен>"

    if (!authorization) {
        return response
            .status(401)
            .send({ message: 'Unauthorized: no token provided' });
    }

    const [, accessToken] = authorization.split(' '); // разбиваем "Bearer xxx" на ["Bearer", "xxx"], берём второй элемент

    if (!accessToken) {
        return response
            .status(401)
            .send({ message: 'Unauthorized: no token provided' });
    }

    try {
        // jwt.verify проверяет подпись токена секретным ключом — если токен подделан
        // или истёк срок действия, эта строка бросит исключение (уйдём в catch)
        const { user }: JwtPayloadWithUser = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        request.user = user;

        next(); // токен верный — передаём запрос дальше, в контроллер
    } catch (error) {
        return response
            .status(401)
            .send({ message: 'Unauthorized: token is invalid or expired' });
    }
};

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
