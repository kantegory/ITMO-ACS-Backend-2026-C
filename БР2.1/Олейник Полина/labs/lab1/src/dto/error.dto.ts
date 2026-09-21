import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// Форма ошибки, которую всегда отдаёт сервер: {statusCode, message, errors?}.
// Сама эта форма не участвует в проверке входящих данных — она нужна только
// для документации Swagger (@ResponseSchema в контроллерах), чтобы там было видно,
// что именно вернётся при ошибке. Реальный ответ строит error-handler.middleware.ts.

class ErrorFieldDto {
    @IsString()
    field: string; // название поля, в котором ошибка (например "email")

    @IsString()
    message: string; // что именно не так
}

class ErrorDto {
    @IsInt()
    statusCode: number;

    @IsString()
    message: string;

    @IsOptional()
    @IsArray()
    @Type(() => ErrorFieldDto)
    errors?: ErrorFieldDto[]; // список ошибок по полям — заполняется только при ошибках валидации (400)
}

export { ErrorFieldDto, ErrorDto };
