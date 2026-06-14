import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Type(() => String)
    password: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Type(() => String)
    fullName: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;
}

export class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

export class RefreshTokenDto {
    @IsString()
    @Type(() => String)
    refreshToken: string;
}
