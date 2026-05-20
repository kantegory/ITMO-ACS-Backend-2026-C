import { IsOptional, IsString } from 'class-validator';

export class MyAccommodationsQueryDto {
    @IsOptional()
    @IsString()
    search?: string;
}