import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserType } from '../models/enums';

export class RegisterDto {
    @IsString()
    @Type(() => String)
    name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;

    @IsEnum(UserType)
    @Type(() => String)
    type: UserType;
}

export class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}
