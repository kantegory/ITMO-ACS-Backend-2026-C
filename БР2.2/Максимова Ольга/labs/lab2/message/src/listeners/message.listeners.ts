import { subscribe } from 'common';          
import { Topics } from 'common';               
import { MessageUser } from '../models/user-cache.entity';
import dataSource from '../config/data-source';

export default async function setupMessageListeners() {
  const MessageUserRepository = dataSource.getRepository(MessageUser);
  await subscribe(Topics.User, async (event: any) => {
    if (event.eventType === 'user.registered') {
      const { id, first_name } = event;
      if (id && first_name) {
        try {
          await MessageUserRepository.upsert(
            { user_id: id, user_name: first_name },
            ['user_id']
          );
        } catch (err) {
          console.error(`Failed to upsert user cache for ${id}`, err);
        }
      }
    }
  });
}