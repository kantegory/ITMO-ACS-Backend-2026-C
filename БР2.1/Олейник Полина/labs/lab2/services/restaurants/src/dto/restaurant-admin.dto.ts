import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

import { RestaurantAdmin } from '../models/restaurant-admin.entity';
import { UserShortDto, toUserShortDto } from './user-short.dto';
import { UserInternal, UserShort } from '../clients/auth-client';

// Адаптация лр1/src/dto/restaurant-admin.dto.ts: у restaurants нет своей сущности
// User, поэтому record.user больше не подгружается связью — данные пользователя
// передаются отдельно (получены через auth-client).
class RestaurantAdminCreateDto {
    @IsInt()
    @Type(() => Number)
    user_id: number;
}

class RestaurantAdminDto {
    id: number;
    user_id: number;
    restaurant_id: number;
    user: UserShortDto;
    created_at: Date;
}

function toRestaurantAdminDto(
    record: RestaurantAdmin,
    user: UserInternal | UserShort,
): RestaurantAdminDto {
    return {
        id: record.id,
        user_id: record.user_id,
        restaurant_id: record.restaurant_id,
        user: toUserShortDto(user),
        created_at: record.created_at,
    };
}

export { RestaurantAdminCreateDto, RestaurantAdminDto, toRestaurantAdminDto };
