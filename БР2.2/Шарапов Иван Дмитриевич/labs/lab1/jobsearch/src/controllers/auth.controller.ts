import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import { signToken } from "../utils/jwt";
import { HttpError } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";

const userRepo = () => AppDataSource.getRepository(User);

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) {
      throw new HttpError(400, "email, password, firstName, lastName обязательны");
    }
    const exists = await userRepo().findOneBy({ email });
    if (exists) {
      throw new HttpError(409, "Пользователь с таким email уже существует");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = userRepo().create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: role === UserRole.EMPLOYER ? UserRole.EMPLOYER : UserRole.APPLICANT,
    });
    await userRepo().save(user);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new HttpError(400, "email и password обязательны");
    }
    const user = await userRepo().findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, "Неверный email или пароль");
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function me(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userRepo().findOne({
      where: { id: req.user!.userId },
      relations: { resume: true, companies: true },
    });
    if (!user) throw new HttpError(404, "Пользователь не найден");
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (e) {
    next(e);
  }
}
