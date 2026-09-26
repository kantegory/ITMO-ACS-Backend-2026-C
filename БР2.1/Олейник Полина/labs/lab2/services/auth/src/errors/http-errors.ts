import { HttpError } from 'routing-controllers';

// routing-controllers уже даёт BadRequestError/UnauthorizedError/ForbiddenError/NotFoundError.
// 409 Conflict среди них нет — добавляем сами, как в монолите (лр1/src/errors/http-errors.ts).
class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message);
        this.name = 'ConflictError';
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

export { ConflictError };
