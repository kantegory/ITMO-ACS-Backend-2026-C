import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { EstateType, BathType } from '../models/Estate.entity';

export class CreateEstateDto {
    @IsNumber()
    user_id: number;

    @IsString()
    address: string;

    @IsEnum(EstateType)
    type: EstateType;

    @IsNumber()
    @Min(0)
    room_amount: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    image_path?: string;

    @IsOptional()
    @IsEnum(BathType)
    bath_type?: BathType;

    @IsOptional()
    @IsBoolean()
    fridge?: boolean;

    @IsOptional()
    @IsBoolean()
    washing_machine?: boolean;

    @IsOptional()
    @IsBoolean()
    internet?: boolean;

    @IsOptional()
    @IsBoolean()
    tv?: boolean;

    @IsOptional()
    @IsBoolean()
    furnished_rooms?: boolean;

    @IsOptional()
    @IsBoolean()
    furnished_kitchen?: boolean;
}

export class UpdateEstateDto {
    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsEnum(EstateType)
    type?: EstateType;

    @IsOptional()
    @IsNumber()
    room_amount?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    image_path?: string;

    @IsOptional()
    @IsEnum(BathType)
    bath_type?: BathType;

    @IsOptional()
    @IsBoolean()
    fridge?: boolean;

    @IsOptional()
    @IsBoolean()
    washing_machine?: boolean;

    @IsOptional()
    @IsBoolean()
    internet?: boolean;

    @IsOptional()
    @IsBoolean()
    tv?: boolean;

    @IsOptional()
    @IsBoolean()
    furnished_rooms?: boolean;

    @IsOptional()
    @IsBoolean()
    furnished_kitchen?: boolean;

    @IsOptional()
    @IsBoolean()
    is_verified?: boolean;

    @IsOptional()
    @IsBoolean()
    is_available?: boolean;
}
