import { AppError } from './AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateRegisterInput(data: any): void {
  const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];
  for (const field of requiredFields) {
    if (!isNonEmptyString(data?.[field])) {
      throw new AppError(`Поле "${field}" обязательно`, 400);
    }
  }
  if (!EMAIL_REGEX.test(data.email)) {
    throw new AppError('Некорректный email', 400);
  }
  if (data.password.length < 6) {
    throw new AppError('Пароль должен быть не короче 6 символов', 400);
  }
}

export function validateLoginInput(data: any): void {
  if (!isNonEmptyString(data?.email) || !isNonEmptyString(data?.password)) {
    throw new AppError('Email и пароль обязательны', 400);
  }
}
