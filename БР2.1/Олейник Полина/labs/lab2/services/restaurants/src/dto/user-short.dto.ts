import { UserInternal, UserShort } from '../clients/auth-client';

// У restaurants нет своей сущности User (владелец — auth, раздел 4 CLAUDE.md).
// Эта форма используется в ответах (отзывы, администраторы ресторана) и строится
// из данных, полученных через auth-client, а не из локальной БД.
class UserShortDto {
    id: number;
    first_name: string;
    last_name: string;
}

function toUserShortDto(user: UserInternal | UserShort): UserShortDto {
    return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
    };
}

export { UserShortDto, toUserShortDto };
