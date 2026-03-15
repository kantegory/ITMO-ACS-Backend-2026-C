import { IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DealStatus } from '../../models/deal.entity';

export enum ApiDealStatus {
    REQUESTED = 'запрошена',
    CONFIRMED = 'подтверждена',
    CANCELLED = 'отменена',
}

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
    id: number;
    createdAt: Date;
    landlordId: number;
    tenantId: number;
    startTime: Date;
    endTime: Date;
    estateId: number;
    status: ApiDealStatus;
}

export class DealsListResponseDto {
    data: DealResponseDto[];
}

export class ErrorResponseDto {
    message: string;
    code: string;
}

export class UpdateDealStatusDto {
    @IsEnum(ApiDealStatus)
    status: ApiDealStatus;
}
