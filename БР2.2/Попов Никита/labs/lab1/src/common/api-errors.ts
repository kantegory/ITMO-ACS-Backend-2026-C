/**
 * DTO для ошибок API в соответствии с OpenAPI спецификацией
 */
export class ApiErrorDto {
    code: string;
    message: string;
    details?: string;
}

export class ValidationErrorDto extends ApiErrorDto {
    errors?: Record<string, string>;
}

export class NotFoundErrorDto extends ApiErrorDto {
    resource?: string;
}

export class UnauthorizedErrorDto extends ApiErrorDto {}

export class ForbiddenErrorDto extends ApiErrorDto {}

export class InternalServerErrorDto extends ApiErrorDto {}
