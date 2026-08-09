import { IsNumber, IsString, IsEnum, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { DealStatus } from '../models/Deal.entity';

export class CreateDealDto {
    @IsNumber()
    landlord_id: number;

    @IsNumber()
    tenant_id: number;

    @IsString()
    period: string;

    @IsEnum(DealStatus)
    deal_status: DealStatus;

    @IsArray()
    @IsNumber({}, { each: true })
    estate_ids: number[];

    @IsBoolean()
    is_published: boolean;
}

export class UpdateDealDto {
    @IsOptional()
    @IsNumber()
    landlord_id?: number;

    @IsOptional()
    @IsNumber()
    tenant_id?: number;

    @IsOptional()
    @IsString()
    period?: string;

    @IsOptional()
    @IsEnum(DealStatus)
    deal_status?: DealStatus;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    estate_ids?: number[];

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}
