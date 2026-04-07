import { IsInt, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

const VALID_MESSAGE_TYPES = ['text', 'image', 'file'] as const;

export class SendMessageRequest {
    @IsInt()
    @Type(() => Number)
    receiver_id: number;

    @IsInt()
    @Type(() => Number)
    accom_id: number;

    @IsString()
    mes_text: string;

    @IsOptional()
    @IsEnum(VALID_MESSAGE_TYPES)
    mes_type?: string;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Type(() => Number)
    attachment_ids?: number[];
}