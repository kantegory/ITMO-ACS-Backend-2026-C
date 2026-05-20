import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RentsListQueryDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sort?: string = 'created_at';
}