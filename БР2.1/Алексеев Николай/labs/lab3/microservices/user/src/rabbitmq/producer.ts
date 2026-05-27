import { publishEvent, EXCHANGES, EVENT_TYPES } from './connection';

export async function userCreated(userId: number, login: string, email: string) {
  await publishEvent(EXCHANGES.USER, EVENT_TYPES.USER_CREATED, {
    userId,
    login,
    email,
    timestamp: new Date().toISOString(),
  });
}

export async function userDeleted(userId: number) {
  await publishEvent(EXCHANGES.USER, EVENT_TYPES.USER_DELETED, {
    userId,
    timestamp: new Date().toISOString(),
  });
}