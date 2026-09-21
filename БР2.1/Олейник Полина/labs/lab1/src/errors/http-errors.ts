import { HttpError } from 'routing-controllers';

// В routing-controllers уже есть готовые классы ошибок с HTTP-кодами:
// BadRequestError (400), UnauthorizedError (401), ForbiddenError (403),
// NotFoundError (404) — их можно просто throw new X('сообщение').
// Но 409 Conflict (например: email уже занят, столик уже забронирован) среди
// них нет — поэтому свой класс, устроенный точно так же, как остальные.
class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message); // 409 — это и есть statusCode, который дальше читает error-handler.middleware.ts
        this.name = 'ConflictError';
        Object.setPrototypeOf(this, ConflictError.prototype); // нужно, чтобы instanceof ConflictError работал правильно после наследования от встроенного Error
    }
}

export { ConflictError };
