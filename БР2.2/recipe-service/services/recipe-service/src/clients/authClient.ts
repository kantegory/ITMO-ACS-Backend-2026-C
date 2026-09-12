import { config } from '../config/config';

export interface PublicUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
}

// Пользователь "по умолчанию", если Auth Service недоступен — чтобы не ронять
// весь ответ Recipe Service из-за проблем в соседнем сервисе (см. ДЗ4, п. "устойчивость")
function fallbackUser(id: number): PublicUser {
  return { id, username: 'неизвестный пользователь', role: 'user' };
}

export async function fetchUser(id: number): Promise<PublicUser> {
  try {
    const res = await fetch(`${config.authServiceUrl}/internal/users/${id}`, {
      headers: { 'X-Internal-Api-Key': config.internalApiKey },
    });
    if (!res.ok) return fallbackUser(id);
    return (await res.json()) as PublicUser;
  } catch (err) {
    console.error('⚠️  Auth Service недоступен (fetchUser):', (err as Error).message);
    return fallbackUser(id);
  }
}

// Батч-версия — используется при отдаче списка рецептов (GET /recipes),
// чтобы не делать по одному запросу на автора каждого рецепта
export async function fetchUsers(ids: number[]): Promise<Map<number, PublicUser>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  try {
    const res = await fetch(`${config.authServiceUrl}/internal/users?ids=${unique.join(',')}`, {
      headers: { 'X-Internal-Api-Key': config.internalApiKey },
    });
    if (!res.ok) throw new Error(`Auth Service ответил ${res.status}`);
    const users = (await res.json()) as PublicUser[];
    return new Map(users.map((u) => [u.id, u]));
  } catch (err) {
    console.error('⚠️  Auth Service недоступен (fetchUsers):', (err as Error).message);
    return new Map(unique.map((id) => [id, fallbackUser(id)]));
  }
}
