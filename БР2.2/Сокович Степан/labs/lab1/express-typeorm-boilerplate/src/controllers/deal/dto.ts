import { IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DealStatus } from '../../models/deal.entity';

export class CreateDealDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    estateId: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    landlordId: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    tenantId: number;

    @IsDateString()
    startTime: string;

    @IsDateString()
    endTime: string;
}

export class DealResponseDto {
    id: string;
    createdAt: Date;
    landlordId: string;
    tenantId: string;
    startTime: Date;
    endTime: Date;
    estateId: string;
    status: DealStatus;
}

export class DealsListResponseDto {
    data: DealResponseDto[];
}

export class ErrorResponseDto {
    message: string;
    code: string;
}

export class UpdateDealStatusDto {
    @IsEnum(DealStatus)
    status: DealStatus;
}
