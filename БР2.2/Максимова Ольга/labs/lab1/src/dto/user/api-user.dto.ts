import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum ApiRole {
    Admin = 'admin',
    User = 'user',
}

export class ApiUser {
    @Type(() => Number)
    @IsNumber()
    id: number;

    role: ApiRole;

    @IsString()
    first_name: string;

    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    middle_name?: string;

    @IsString()
    last_name: string;

    @Type(() => Boolean)
    @IsBoolean()
    is_verified: boolean;
}