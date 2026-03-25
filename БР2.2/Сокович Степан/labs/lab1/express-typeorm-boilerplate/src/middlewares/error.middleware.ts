import { NextFunction, Request, Response } from 'express';

const statusCodeToErrorCode = (statusCode: number): string => {
    if (statusCode === 400) return 'VALIDATION_ERROR';
    if (statusCode === 401) return 'UNAUTHORIZED';
    if (statusCode === 404) return 'NOT_FOUND';
    if (statusCode === 409) return 'CONFLICT';
    return 'INTERNAL_ERROR';
};

const errorMiddleware = (
    error: any,
    _request: Request,
    response: Response,
    _next: NextFunction,
) => {
    const statusCode =
        typeof error?.httpCode === 'number'
            ? error.httpCode
            : typeof error?.status === 'number'
                ? error.status
                : 500;

    const message =
        statusCode === 400 && error?.name === 'BadRequestError'
            ? 'Ошибка валидации'
            : error?.message || 'Внутренняя ошибка сервера';

    response.status(statusCode).send({
        message,
        code: statusCodeToErrorCode(statusCode),
    });
};

export default errorMiddleware;
