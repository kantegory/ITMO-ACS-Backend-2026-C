import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt } from 'class-validator';
import { DealStatus } from '../models/enums';

export class CreateDealDto {
    @Type(() => Number)
    @IsInt()
    estateId: number;

    @Type(() => Number)
    @IsInt()
    landlordId: number;

    @Type(() => Number)
    @IsInt()
    tenantId: number;

    @IsDateString()
    @Type(() => String)
    startTime: string;

    @IsDateString()
    @Type(() => String)
    endTime: string;
}

export class UpdateDealStatusDto {
    @IsEnum(DealStatus)
    @Type(() => String)
    status: DealStatus;
}
