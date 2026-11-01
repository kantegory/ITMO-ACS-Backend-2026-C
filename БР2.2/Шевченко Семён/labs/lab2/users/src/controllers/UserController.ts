import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../database";
import { User } from "../entities/User";

export class UserController {
  static async register(req: Request, res: Response) {
    const { email, password, name } = req.body ?? {};
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || typeof password !== "string" || password.length < 6 || Buffer.byteLength(password) > 72 || typeof name !== "string" || !name.trim() || name.length > 100) {
      return res.status(400).json({ message: "Укажите email, имя и пароль от 6 символов" });
    }
    const repo = db.getRepository(User);
    const user = repo.create({ email: email.toLowerCase(), name, role: "USER", password_hash: await bcrypt.hash(password, 10) });
    await repo.save(user);
    res.status(201).json(await repo.findOneBy({ id: user.id }));
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Укажите email и пароль" });
    }
    const user = await db.getRepository(User).createQueryBuilder("u")
      .addSelect("u.password_hash").where("u.email = :email", { email: email.toLowerCase() }).getOne();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    res.json({ token });
  }

  static async me(req: Request, res: Response) {
    res.json(await db.getRepository(User).findOneBy({ id: res.locals.user.id }));
  }

  static async update(req: Request, res: Response) {
    const { name, phone } = req.body ?? {};
    if (typeof name !== "string" || !name.trim() || name.length > 100 || (phone != null && (typeof phone !== "string" || phone.length > 20))) {
      return res.status(400).json({ message: "Укажите имя и телефон строкой" });
    }
    await db.getRepository(User).update(res.locals.user.id, { name, phone, updated_at: new Date() });
    res.json(await db.getRepository(User).findOneBy({ id: res.locals.user.id }));
  }
}
