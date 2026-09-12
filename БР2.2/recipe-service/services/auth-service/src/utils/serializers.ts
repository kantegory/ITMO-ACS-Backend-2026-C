import { User } from '../models/user.entity';

// Убираем из ответа чувствительные поля (passwordHash, emailVerificationToken)
export function serializeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar ?? undefined,
    role: user.role,
  };
}

// Урезанная версия для межсервисных ответов (без email — его знать другим сервисам не нужно)
export function serializePublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar ?? undefined,
    role: user.role,
  };
}
