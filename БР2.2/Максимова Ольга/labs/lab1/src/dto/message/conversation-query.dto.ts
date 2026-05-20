import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ConversationQueryDto {
    @IsInt()
    @Type(() => Number)
    accom_id: number;

    @IsInt()
    @Type(() => Number)
    user_id: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    limit?: number = 10;
}