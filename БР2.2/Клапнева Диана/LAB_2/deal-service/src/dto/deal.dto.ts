import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

export class CreateDealDto {
    @IsNumber()
    landlord_id: number;

    @IsNumber()
    tenant_id: number;

    @IsNumber()
    period: number;

    @IsString()
    @IsOptional()
    @IsIn(['pending', 'active', 'closed', 'cancelled'])
    deal_status?: string;

    @IsBoolean()
    @IsOptional()
    is_published?: boolean;
}

export class UpdateDealDto {
    @IsNumber()
    @IsOptional()
    landlord_id?: number;

    @IsNumber()
    @IsOptional()
    tenant_id?: number;

    @IsNumber()
    @IsOptional()
    period?: number;

    @IsString()
    @IsOptional()
    @IsIn(['pending', 'active', 'closed', 'cancelled'])
    deal_status?: string;

    @IsBoolean()
    @IsOptional()
    is_published?: boolean;
}

export class DealResponseDto {
    id: number;
    landlord_id: number;
    tenant_id: number;
    period: number;
    deal_status: string;
    is_published: boolean;
    created_at: Date;
    updated_at: Date;

    constructor(deal: any) {
        this.id = deal.id;
        this.landlord_id = deal.landlordId;
        this.tenant_id = deal.tenantId;
        this.period = deal.period;
        this.deal_status = deal.dealStatus;
        this.is_published = deal.isPublished;
        this.created_at = deal.created_at;
        this.updated_at = deal.updated_at;
    }
}
