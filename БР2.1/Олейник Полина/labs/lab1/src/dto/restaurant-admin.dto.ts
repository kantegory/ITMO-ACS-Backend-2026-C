import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

import { RestaurantAdmin } from '../models/restaurant-admin.entity';
import { UserShortDto, toUserShortDto } from './user.dto';

// Тело запроса POST /restaurants/{id}/admins — кого назначить администратором
class RestaurantAdminCreateDto {
    @IsInt()
    @Type(() => Number)
    user_id: number;
}

// Форма записи "пользователь администрирует ресторан" в ответах
class RestaurantAdminDto {
    id: number;
    user_id: number;
    restaurant_id: number;
    user: UserShortDto;
    created_at: Date;
}

function toRestaurantAdminDto(record: RestaurantAdmin): RestaurantAdminDto {
    return {
        id: record.id,
        user_id: record.user_id,
        restaurant_id: record.restaurant_id,
        user: toUserShortDto(record.user), // ожидается, что record.user уже подгружен (relations: ['user'])
        created_at: record.created_at,
    };
}

export { RestaurantAdminCreateDto, RestaurantAdminDto, toRestaurantAdminDto };
