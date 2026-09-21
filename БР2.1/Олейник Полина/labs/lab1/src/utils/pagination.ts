import { PageMetaDto } from '../dto/pagination.dto';

// TypeORM понимает не "номер страницы", а "сколько строк пропустить" (skip) и
// "сколько взять" (take). Эта функция переводит понятные пользователю page/limit
// в понятные TypeORM skip/take. Например: page=2, limit=20 -> skip=20, take=20
// (пропустить первую страницу из 20 строк, взять следующие 20).
function getSkipTake(page = 1, limit = 20): { skip: number; take: number } {
    return {
        skip: (page - 1) * limit,
        take: limit,
    };
}

// Собирает объект meta для ответа {items, meta} — по общему количеству строк
// вычисляет, сколько всего страниц.
function buildPageMeta(total: number, page = 1, limit = 20): PageMetaDto {
    return {
        total,
        page,
        limit,
        total_pages: total === 0 ? 0 : Math.ceil(total / limit), // Math.ceil — округление вверх: 21 запись при limit=20 даёт 2 страницы, а не 1
    };
}

export { getSkipTake, buildPageMeta };
