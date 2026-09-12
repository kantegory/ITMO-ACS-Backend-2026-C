import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/user.entity';
import { serializePublicUser } from '../utils/serializers';

const userRepo = () => AppDataSource.getRepository(User);

// GET /internal/users/{id} — используется Recipe Service (автор рецепта) и Social Service (автор комментария)
export async function getPublicUserById(id: number) {
  const user = await userRepo().findOne({ where: { id } });
  return user ? serializePublicUser(user) : null;
}

// GET /internal/users?ids=1,2,3 — батч-версия, чтобы не дёргать по одному пользователю на каждый рецепт списка
export async function getPublicUsersByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const users = await userRepo().findBy({ id: In(ids) });
  return users.map(serializePublicUser);
}
