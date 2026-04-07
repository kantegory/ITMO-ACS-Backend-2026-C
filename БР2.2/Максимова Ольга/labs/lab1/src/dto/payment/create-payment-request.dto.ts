import { IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentRequest {
    @IsInt()
    @Type(() => Number)
    rent_id: number;

    @IsNumber()
    @Type(() => Number)
    @Min(1) 
    amount: number;
}