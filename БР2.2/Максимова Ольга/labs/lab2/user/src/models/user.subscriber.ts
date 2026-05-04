import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
} from 'typeorm';
import { User } from './user.entity';
import {hashPassword, checkPassword} from 'common';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo() {
        return User;
    }

    async beforeInsert(event: InsertEvent<User>) {
        if (event.entity.password && !event.entity.password.startsWith('$2b$')) {
            event.entity.password = hashPassword(event.entity.password);
        }
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        if (event.entity && event.databaseEntity) {
            const changed = event.updatedColumns.map(c => c.propertyName);
            const passwordChanged = !checkPassword(event.databaseEntity.password, event.entity.password);
            if (changed.includes('password') && passwordChanged) {
                event.entity.password = hashPassword(event.entity.password);
            } else {
                event.entity.password = event.databaseEntity.password;
            }
        }
    }
}
