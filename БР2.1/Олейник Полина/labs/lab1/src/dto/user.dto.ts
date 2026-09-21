import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

import { User } from '../models/user.entity';
import { Role } from '../models/enums/role.enum';

// Короткая форма пользователя — используется там, где нужно только показать,
// кто автор (отзыва, назначения администратором), без лишних данных.
class UserShortDto {
    id: number;
    first_name: string;
    last_name: string;
}

// Превращает сущность User (из базы, с хэшем пароля) в UserShortDto.
// Мы НЕ отдаём entity напрямую в ответ API — вручную выбираем, какие поля
// показать, чтобы случайно не отправить password.
function toUserShortDto(user: User): UserShortDto {
    return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
    };
}

// Полный профиль пользователя в ответах API — тоже без пароля.
class UserResponseDto {
    id: number;
    role: Role;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    created_at: Date;
    updated_at: Date;
}

// Тело запроса PATCH /users/me — все поля необязательные (можно передать только то, что меняешь).
class UserUpdateDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @Type(() => String)
    first_name?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @Type(() => String)
    last_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;
}

// То же самое, что toUserShortDto, но с полным набором полей — для /users/me и /auth/*.
function toUserResponseDto(user: User): UserResponseDto {
    return {
        id: user.id,
        role: user.role,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}

export {
    UserResponseDto,
    UserUpdateDto,
    UserShortDto,
    toUserResponseDto,
    toUserShortDto,
};
