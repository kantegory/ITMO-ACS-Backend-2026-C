import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { UserRole } from "../models/User";
import { usersService } from "../services/users.service";
import { serializePage, serializeUser } from "../utils/serializers";

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

class UsersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      if (req.user.role !== UserRole.ADMIN) throw new AppError(403, "Недостаточно прав");

      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 20;

      const result = await usersService.list({
        page,
        pageSize,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        role: typeof req.query.role === "string" ? (req.query.role as UserRole) : undefined,
        isActive: parseBoolean(req.query.isActive),
        isVerified: parseBoolean(req.query.isVerified),
      });

      res.status(200).json(serializePage(result, serializeUser));
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      const result = await usersService.getMe(req.user.id);
      res.status(200).json(serializeUser(result));
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");

      const { firstName, lastName, middleName, email } = req.body;
      const result = await usersService.update(req.user.id, {
        firstName,
        lastName,
        middleName,
        email,
      });

      res.status(200).json(serializeUser(result));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await usersService.getById(id);
      res.status(200).json(serializeUser(result));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      if (req.user.role !== UserRole.ADMIN) throw new AppError(403, "Недостаточно прав");

      const id = Number(req.params.id);
      const result = await usersService.update(id, req.body);
      res.status(200).json(serializeUser(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, "Требуется авторизация");
      if (req.user.role !== UserRole.ADMIN) throw new AppError(403, "Недостаточно прав");

      const id = Number(req.params.id);
      await usersService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
