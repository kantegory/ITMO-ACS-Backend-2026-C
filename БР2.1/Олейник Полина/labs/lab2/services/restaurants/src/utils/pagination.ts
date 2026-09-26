import { PageMetaDto } from '../dto/pagination.dto';

// Копия лр1/src/utils/pagination.ts.
function getSkipTake(page = 1, limit = 20): { skip: number; take: number } {
    return {
        skip: (page - 1) * limit,
        take: limit,
    };
}

function buildPageMeta(total: number, page = 1, limit = 20): PageMetaDto {
    return {
        total,
        page,
        limit,
        total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    };
}

export { getSkipTake, buildPageMeta };
