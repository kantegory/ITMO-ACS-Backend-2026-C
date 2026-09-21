import {
    EventSubscriber,
    EntitySubscriberInterface,
    UpdateEvent,
    InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

import hashPassword from '../utils/hash-password';
import checkPassword from '../utils/check-password';

// "Подписчик" TypeORM — код, который автоматически выполняется до/после
// сохранения записи в базу. Здесь он следит за паролем пользователя:
// нигде в коде контроллеров не нужно вручную хэшировать пароль —
// это происходит само при любом repository.save(user), где бы он ни вызывался.
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    // говорим TypeORM: "следи только за таблицей User"
    listenTo() {
        return User;
    }

    // срабатывает перед обновлением существующего пользователя
    async beforeUpdate(event: UpdateEvent<User>) {
        if (event.entity && event.databaseEntity) {
            const changedColumns = event.updatedColumns.map(
                (col) => col.propertyName,
            );

            // сравниваем то, что прислали, с тем, что уже лежит в базе (как хэш)
            const isPasswordChanged = !checkPassword(
                event.databaseEntity.password,
                event.entity.password,
            );

            if (changedColumns.includes('password') && isPasswordChanged) {
                // пароль реально меняют — хэшируем новое значение
                event.entity.password = hashPassword(event.entity.password);
            } else {
                // пароль не трогали — оставляем прежний хэш как есть,
                // иначе он случайно перезаписался бы "хэшем от хэша"
                event.entity.password = event.databaseEntity.password;
            }
        }
    }

    // срабатывает перед созданием нового пользователя
    async beforeInsert(event: InsertEvent<User>) {
        // если пароль ещё не похож на bcrypt-хэш (не начинается с "$2b$") — хэшируем его.
        // Эта проверка защищает от повторного хэширования, если пароль уже пришёл хэшированным.
        if (
            event.entity.password &&
            !event.entity.password.startsWith('$2b$')
        ) {
            event.entity.password = hashPassword(event.entity.password);
        }
    }
}
