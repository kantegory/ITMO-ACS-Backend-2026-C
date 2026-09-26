import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

import { UserResponseDto } from './user.dto';

// Тело запроса POST /auth/register.
class RegisterDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Type(() => String)
    password: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @Type(() => String)
    first_name: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @Type(() => String)
    last_name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;
}

// Тело запроса POST /auth/login.
class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

// Ответ и на регистрацию, и на вход.
class AuthResponseDto {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: UserResponseDto;
}

export { RegisterDto, LoginDto, AuthResponseDto };
