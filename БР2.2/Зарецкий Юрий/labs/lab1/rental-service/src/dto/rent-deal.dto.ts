import { IsString, IsOptional, IsNumber, IsIn, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRentDealDto {
    @IsNumber()
    @Type(() => Number)
    propertyId: number;

    @IsString()
    @Type(() => String)
    startDate: string;

    @IsString()
    @Type(() => String)
    endDate: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    @Type(() => String)
    comment?: string;
}

export class UpdateDealStatusDto {
    @IsIn(['approved', 'cancelled'])
    status: 'approved' | 'cancelled';

    @IsOptional()
    @IsString()
    @MaxLength(500)
    @Type(() => String)
    cancellationReason?: string;
}
