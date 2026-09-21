import { Request, Response, NextFunction } from 'express';
import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { ValidationError } from 'class-validator';

interface FieldError {
    field: string;
    message: string;
}

// class-validator при ошибке валидации возвращает не плоский список, а дерево
// (у каждого ValidationError может быть свой список .children для вложенных объектов).
// Эта функция "разворачивает" дерево в простой плоский список {field, message},
// который и требует спецификация в поле errors.
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
            // constraints — это объект вида { isEmail: "email must be an email" },
            // берём только сами тексты сообщений
            for (const message of Object.values(error.constraints)) {
                result.push({ field: path, message });
            }
        }

        if (error.children && error.children.length > 0) {
            // рекурсия — на случай вложенных объектов в теле запроса
            result.push(...flattenValidationErrors(error.children, path));
        }
    }

    return result;
}

// Единая точка обработки ошибок для ВСЕХ контроллеров. Подключается в app.ts
// (middlewares: [ErrorHandlerMiddleware], defaultErrorHandler: false) — то есть
// вместо стандартного поведения routing-controllers (которое отдавало бы стек
// вызовов в ответе) любая ошибка (throw new NotFoundError(...), throw new ConflictError(...),
// ошибка валидации и вообще любое исключение) попадает сюда и приводится
// к единому виду {statusCode, message, errors?}.
@Middleware({ type: 'after' }) // 'after' — этот middleware выполняется ПОСЛЕ контроллера, только если тот бросил ошибку
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

        // error.httpCode — у классов типа NotFoundError/ConflictError (наследники HttpError).
        // error.status — у ошибок express (например, "битый" JSON в теле запроса).
        // Если ни того, ни другого нет — это либо ошибка валидации (400), либо
        // непредвиденная ошибка программиста (500).
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
            // это непредвиденная ошибка — печатаем полную информацию в консоль сервера
            // для отладки, но клиенту отдаём общее сообщение, чтобы не показать
            // детали внутреннего устройства сервера
            console.error(error);
            body.message = 'Внутренняя ошибка сервера';
        }

        response.status(statusCode).json(body);
    }
}

export default ErrorHandlerMiddleware;
