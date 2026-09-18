import { AppError } from './AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIFFICULTIES = ['easy', 'medium', 'hard'];

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

export function validateRecipeInput(data: any): void {
  const requiredStrings = ['title', 'shortDescription', 'fullDescription'];
  for (const field of requiredStrings) {
    if (!isNonEmptyString(data?.[field])) {
      throw new AppError(`Поле "${field}" обязательно`, 400);
    }
  }

  if (!DIFFICULTIES.includes(data?.difficulty)) {
    throw new AppError('Поле "difficulty" должно быть easy, medium или hard', 400);
  }

  if (typeof data?.cookingTime !== 'number' || data.cookingTime <= 0) {
    throw new AppError('Поле "cookingTime" должно быть положительным числом (в минутах)', 400);
  }

  if (typeof data?.categoryId !== 'number') {
    throw new AppError('Поле "categoryId" обязательно и должно быть числом', 400);
  }

  if (!Array.isArray(data?.tagIds)) {
    throw new AppError('Поле "tagIds" должно быть массивом (можно пустым)', 400);
  }

  if (!Array.isArray(data?.ingredients) || data.ingredients.length === 0) {
    throw new AppError('Нужно указать хотя бы один ингредиент', 400);
  }
  for (const ingredient of data.ingredients) {
    if (!isNonEmptyString(ingredient?.name) || !isNonEmptyString(ingredient?.quantity)) {
      throw new AppError('У каждого ингредиента должны быть поля name и quantity', 400);
    }
  }

  if (!Array.isArray(data?.steps) || data.steps.length === 0) {
    throw new AppError('Нужно указать хотя бы один шаг приготовления', 400);
  }
  for (const step of data.steps) {
    if (typeof step?.order !== 'number' || !isNonEmptyString(step?.description)) {
      throw new AppError('У каждого шага должны быть поля order (число) и description', 400);
    }
  }
}

export function validateCommentInput(data: any): void {
  if (!isNonEmptyString(data?.text)) {
    throw new AppError('Текст комментария обязателен', 400);
  }
}
