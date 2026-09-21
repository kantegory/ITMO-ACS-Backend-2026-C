import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// DTO (Data Transfer Object) — класс, который описывает форму данных,
// которые приходят в запросе или уходят в ответе. class-validator по декораторам
// (@IsInt, @Min и т.д.) автоматически проверяет входящие данные и возвращает 400,
// если что-то не так — не нужно писать проверки руками в каждом контроллере.

// Query-параметры страницы (?page=1&limit=20), общие для всех списков с пагинацией.
class PaginationQueryDto {
    @IsOptional() // параметр необязательный — если не передан, используется значение по умолчанию ниже
    @Type(() => Number) // из URL параметры всегда приходят строками — превращаем в число перед проверкой
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100) // не больше 100 записей на страницу — защита от слишком тяжёлых запросов
    limit: number = 20;
}

// Форма "meta" в ответе {items, meta} — сколько всего записей и страниц.
class PageMetaDto {
    @IsInt()
    total: number;

    @IsInt()
    page: number;

    @IsInt()
    limit: number;

    @IsInt()
    total_pages: number;
}

export { PaginationQueryDto, PageMetaDto };
