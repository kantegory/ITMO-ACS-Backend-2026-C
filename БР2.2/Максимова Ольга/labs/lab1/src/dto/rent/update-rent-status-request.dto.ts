import { IsEnum } from 'class-validator';

export const RENT_STATUSES = ['ongoing', 'closed'] as const;

export class UpdateRentStatusRequest {
    @IsEnum(RENT_STATUSES)
    status: string;
}