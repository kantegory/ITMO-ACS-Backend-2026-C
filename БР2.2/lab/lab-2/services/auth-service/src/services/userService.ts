import { AppDataSource } from '../config/data-source';
import { User } from '../models/user.entity';
import { AppError } from '../utils/AppError';
import { serializeUser } from '../utils/serializers';

const userRepo = () => AppDataSource.getRepository(User);

export async function getMe(userId: number) {
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!user) throw new AppError('Пользователь не найден', 404);
  return serializeUser(user);
}

interface UpdateMeDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export async function updateMe(userId: number, data: UpdateMeDto) {
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!user) throw new AppError('Пользователь не найден', 404);

  if (data.username && data.username !== user.username) {
    const exists = await userRepo().findOne({ where: { username: data.username } });
    if (exists) throw new AppError('Такой никнейм уже занят', 409);
    user.username = data.username;
  }
  if (data.firstName !== undefined) user.firstName = data.firstName;
  if (data.lastName !== undefined) user.lastName = data.lastName;
  if (data.avatar !== undefined) user.avatar = data.avatar;

  const saved = await userRepo().save(user);
  return serializeUser(saved);
}
