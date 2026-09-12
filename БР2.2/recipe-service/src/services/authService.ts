import crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/user.entity';
import { AppError } from '../utils/AppError';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { serializeUser } from '../utils/serializers';
import { validateRegisterInput, validateLoginInput } from '../utils/validators';

const userRepo = () => AppDataSource.getRepository(User);

interface RegisterDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export async function register(data: RegisterDto) {
  validateRegisterInput(data);

  const existingEmail = await userRepo().findOne({ where: { email: data.email } });
  if (existingEmail) {
    throw new AppError('Пользователь с таким email уже зарегистрирован', 409);
  }
  const existingUsername = await userRepo().findOne({ where: { username: data.username } });
  if (existingUsername) {
    throw new AppError('Такой никнейм уже занят', 409);
  }

  const passwordHash = await hashPassword(data.password);
  const emailVerificationToken = crypto.randomBytes(20).toString('hex');

  const user = userRepo().create({
    username: data.username,
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    avatar: data.avatar,
    role: 'user',
    isEmailVerified: false,
    emailVerificationToken,
  });
  const saved = await userRepo().save(user);

  // Реальную отправку почты в этом проекте не делаем (нет почтового сервиса в стеке курса) —
  // токен подтверждения просто выводим в консоль сервера, чтобы его можно было протестировать вручную.
  console.log(`✉️  Токен подтверждения email для ${saved.email}: ${emailVerificationToken}`);

  return serializeUser(saved);
}

interface LoginDto {
  email: string;
  password: string;
}

export async function login(data: LoginDto): Promise<{ token: string }> {
  validateLoginInput(data);

  const user = await userRepo().findOne({ where: { email: data.email } });
  if (!user) {
    throw new AppError('Неверный email или пароль', 401);
  }
  const isValid = await comparePassword(data.password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Неверный email или пароль', 401);
  }

  const token = signToken({ id: user.id, role: user.role });
  return { token };
}

export async function verifyEmail(token: string): Promise<void> {
  if (!token) {
    throw new AppError('Токен подтверждения обязателен', 400);
  }
  const user = await userRepo().findOne({ where: { emailVerificationToken: token } });
  if (!user) {
    throw new AppError('Неверный или устаревший токен подтверждения', 400);
  }
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  await userRepo().save(user);
}
