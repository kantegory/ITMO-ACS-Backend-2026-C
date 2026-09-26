import { IsEnum } from 'class-validator';

import { User } from '../models/user.entity';
import { Role } from '../models/enums/role.enum';

// Формат внутреннего API (docs/openapi-internal.yaml) отличается от публичного:
// без email/phone/password/timestamps — эти данные другим сервисам не нужны.

// Схема UserShort — GET /internal/users
class UserShortResponseDto {
    id: number;
    first_name: string;
    last_name: string;
}

// Схема UserInternal — GET /internal/users/{userId}, PATCH /internal/users/{userId}/role
class UserInternalResponseDto {
    id: number;
    role: Role;
    first_name: string;
    last_name: string;
}

// Схема RoleUpdate — тело запроса PATCH /internal/users/{userId}/role
class RoleUpdateDto {
    @IsEnum(Role)
    role: Role;
}

function toUserShortResponseDto(user: User): UserShortResponseDto {
    return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
    };
}

function toUserInternalResponseDto(user: User): UserInternalResponseDto {
    return {
        id: user.id,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
    };
}

export {
    UserShortResponseDto,
    UserInternalResponseDto,
    RoleUpdateDto,
    toUserShortResponseDto,
    toUserInternalResponseDto,
};
