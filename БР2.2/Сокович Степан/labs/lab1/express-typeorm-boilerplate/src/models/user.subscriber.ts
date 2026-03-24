import {
    EventSubscriber,
    EntitySubscriberInterface,
    UpdateEvent,
    InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

import hashPassword from '../utils/hash-password';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo() {
        return User;
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        if (event.entity && event.databaseEntity) {
            const changedColumns = event.updatedColumns.map(
                (col) => col.propertyName,
            );

            const hasPlaintextHash =
                !!event.entity.hashedPw && !event.entity.hashedPw.startsWith('$2');

            if (changedColumns.includes('hashedPw') && hasPlaintextHash) {
                event.entity.hashedPw = hashPassword(event.entity.hashedPw);
            } else if (!event.entity.hashedPw) {
                event.entity.hashedPw = event.databaseEntity.hashedPw;
            }
        }
    }

    async beforeInsert(event: InsertEvent<User>) {
        if (
            event.entity.hashedPw &&
            !event.entity.hashedPw.startsWith('$2')
        ) {
            event.entity.hashedPw = hashPassword(event.entity.hashedPw);
        }
    }
}
