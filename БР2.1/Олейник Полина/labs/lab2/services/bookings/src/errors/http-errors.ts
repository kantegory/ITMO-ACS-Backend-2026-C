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

// Сбой вызываемого сервиса при межсервисном вызове (раздел 7 CLAUDE.md):
// нет соединения или 5xx от него -> клиенту 503.
class ServiceUnavailableError extends HttpError {
    constructor(message = 'Service unavailable') {
        super(503, message);
        this.name = 'ServiceUnavailableError';
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
}

// Таймаут межсервисного вызова (3 секунды, раздел 7 CLAUDE.md) -> клиенту 504.
class GatewayTimeoutError extends HttpError {
    constructor(message = 'Gateway timeout') {
        super(504, message);
        this.name = 'GatewayTimeoutError';
        Object.setPrototypeOf(this, GatewayTimeoutError.prototype);
    }
}

export { ConflictError, ServiceUnavailableError, GatewayTimeoutError };
