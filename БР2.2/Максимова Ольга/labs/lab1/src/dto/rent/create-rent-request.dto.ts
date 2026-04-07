import { IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRentRequest {
    @IsInt()
    @Type(() => Number)
    accom_id: number;

    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;
}