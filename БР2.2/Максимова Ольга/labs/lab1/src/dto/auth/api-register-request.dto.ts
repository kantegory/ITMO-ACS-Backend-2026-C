import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ApiRegisterRequest {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;

    @IsString()
    @Type(() => String)
    first_name: string;

    @IsString()
    @Type(() => String)
    last_name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    middle_name?: string;
}