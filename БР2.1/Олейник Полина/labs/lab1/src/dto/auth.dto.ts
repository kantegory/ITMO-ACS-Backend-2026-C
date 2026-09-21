import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

import { UserResponseDto } from './user.dto';

// Тело запроса POST /auth/register.
class RegisterDto {
    @IsEmail() // проверяет, что строка похожа на email
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(8) // пароль от 8 символов — как требует спецификация
    @MaxLength(72) // у bcrypt есть техническое ограничение на длину пароля
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

// Ответ и на регистрацию, и на вход — токен плюс профиль пользователя.
class AuthResponseDto {
    access_token: string; // сам JWT-токен, дальше клиент шлёт его в заголовке Authorization: Bearer <токен>
    token_type: string; // всегда "Bearer"
    expires_in: number; // через сколько секунд токен станет недействительным
    user: UserResponseDto;
}

export { RegisterDto, LoginDto, AuthResponseDto };
