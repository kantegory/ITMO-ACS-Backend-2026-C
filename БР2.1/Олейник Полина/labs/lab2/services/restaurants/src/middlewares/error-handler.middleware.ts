import { Request, Response, NextFunction } from 'express';
import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { ValidationError } from 'class-validator';

interface FieldError {
    field: string;
    message: string;
}

// class-validator возвращает дерево ошибок — разворачиваем в плоский список {field, message},
// как требует формат ошибок из раздела 7 CLAUDE.md.
function flattenValidationErrors(
    errors: ValidationError[],
    parentPath = '',
): FieldError[] {
    const result: FieldError[] = [];

    for (const error of errors) {
        const path = parentPath
            ? `${parentPath}.${error.property}`
            : error.property;

        if (error.constraints) {
            for (const message of Object.values(error.constraints)) {
                result.push({ field: path, message });
            }
        }

        if (error.children && error.children.length > 0) {
            result.push(...flattenValidationErrors(error.children, path));
        }
    }

    return result;
}

// Единая точка обработки ошибок для всех контроллеров (копия лр1/src/middlewares/error-handler.middleware.ts).
@Middleware({ type: 'after' })
class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
    error(
        error: any,
        request: Request,
        response: Response,
        next: NextFunction,
    ): void {
        const isValidationError =
            Array.isArray(error.errors) &&
            error.errors.length > 0 &&
            error.errors[0] instanceof ValidationError;

        const statusCode: number =
            error.httpCode || error.status || (isValidationError ? 400 : 500);

        const body: {
            statusCode: number;
            message: string;
            errors?: FieldError[];
        } = {
            statusCode,
            message: error.message || 'Внутренняя ошибка сервера',
        };

        if (isValidationError) {
            body.message = 'Ошибка валидации';
            body.errors = flattenValidationErrors(error.errors);
        }

        if (statusCode >= 500) {
            console.error(error);
            body.message = 'Внутренняя ошибка сервера';
        }

        response.status(statusCode).json(body);
    }
}

export default ErrorHandlerMiddleware;
