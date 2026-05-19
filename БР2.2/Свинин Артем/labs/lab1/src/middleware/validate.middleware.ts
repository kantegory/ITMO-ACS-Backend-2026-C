import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

export const requireBodyFields =
  (fields: string[]) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== "object") {
      next(new AppError(400, "Тело запроса должно быть объектом"));
      return;
    }

    const missing = fields.filter((field) => req.body[field] === undefined);
    if (missing.length > 0) {
      next(new AppError(400, `Отсутствуют обязательные поля: ${missing.join(", ")}`));
      return;
    }

    next();
  };

export const validateRegisterBody = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.body || typeof req.body !== "object") {
    next(new AppError(400, "Тело запроса должно быть объектом"));
    return;
  }

  const { firstName, lastName, middleName, email, password } = req.body as Record<string, unknown>;

  if (typeof firstName !== "string" || firstName.trim().length < 2 || firstName.trim().length > 100) {
    next(new AppError(400, "Поле firstName должно быть строкой длиной от 2 до 100 символов"));
    return;
  }

  if (typeof lastName !== "string" || lastName.trim().length < 2 || lastName.trim().length > 100) {
    next(new AppError(400, "Поле lastName должно быть строкой длиной от 2 до 100 символов"));
    return;
  }

  if (middleName !== undefined) {
    if (typeof middleName !== "string" || middleName.trim().length > 100) {
      next(new AppError(400, "Поле middleName должно быть строкой длиной до 100 символов"));
      return;
    }
  }

  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 255) {
    next(new AppError(400, "Поле email имеет некорректный формат"));
    return;
  }

  if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
    next(
      new AppError(
        400,
        "Пароль должен быть длиной 8-64 символа и содержать минимум одну строчную букву, одну заглавную букву и одну цифру"
      )
    );
    return;
  }

  req.body.firstName = firstName.trim();
  req.body.lastName = lastName.trim();
  req.body.middleName = typeof middleName === "string" ? middleName.trim() : undefined;
  req.body.email = email.trim().toLowerCase();

  next();
};

export const validateLoginBody = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.body || typeof req.body !== "object") {
    next(new AppError(400, "Тело запроса должно быть объектом"));
    return;
  }

  const { email, password } = req.body as Record<string, unknown>;

  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 255) {
    next(new AppError(400, "Поле email имеет некорректный формат"));
    return;
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 64) {
    next(new AppError(400, "Поле password должно быть строкой длиной от 8 до 64 символов"));
    return;
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

export const validateRefreshBody = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.body || typeof req.body !== "object") {
    next(new AppError(400, "Тело запроса должно быть объектом"));
    return;
  }

  const { refreshToken } = req.body as Record<string, unknown>;

  if (typeof refreshToken !== "string") {
    next(new AppError(400, "Поле refreshToken должно быть строкой"));
    return;
  }

  const token = refreshToken.trim();
  const tokenParts = token.split(".");
  if (token.length < 20 || tokenParts.length !== 3) {
    next(new AppError(400, "Поле refreshToken имеет некорректный формат"));
    return;
  }

  req.body.refreshToken = token;

  next();
};

export const validateIdParam =
  (paramName = "id") => (req: Request, _res: Response, next: NextFunction) => {
    const rawValue = req.params[paramName];
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) {
      next(new AppError(400, `Параметр ${paramName} должен быть положительным числом`));
      return;
    }

    next();
  };

export const validateNumberQuery =
  (queryName: string, required = false) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const rawValue = req.query[queryName];
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (required) {
        next(new AppError(400, `Параметр ${queryName} обязателен`));
        return;
      }
      next();
      return;
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      next(new AppError(400, `Параметр ${queryName} должен быть числом`));
      return;
    }

    next();
  };

export const validatePagination = (req: Request, _res: Response, next: NextFunction) => {
  const page = req.query.page;
  const pageSize = req.query.pageSize;

  if (page !== undefined) {
    const pageNumber = Number(page);
    if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
      next(new AppError(400, "Параметр page должен быть положительным целым числом"));
      return;
    }
  }

  if (pageSize !== undefined) {
    const pageSizeNumber = Number(pageSize);
    if (!Number.isInteger(pageSizeNumber) || pageSizeNumber <= 0) {
      next(new AppError(400, "Параметр pageSize должен быть положительным целым числом"));
      return;
    }
  }

  next();
};
