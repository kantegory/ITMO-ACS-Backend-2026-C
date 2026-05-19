import { AppError } from "./app-error";

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Требуется авторизация") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Недостаточно прав") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ресурс не найден") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

