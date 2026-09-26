import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Копия лр1/src/dto/pagination.dto.ts.
class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;
}

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
