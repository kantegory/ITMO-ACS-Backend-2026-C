import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

dotenv.config();

enum UserRole {
  APPLICANT = "applicant",
  EMPLOYER = "employer",
}

@Entity("users")
class User {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) email!: string;
  @Column({ name: "password_hash" }) passwordHash!: string;
  @Column({ name: "first_name" }) firstName!: string;
  @Column({ name: "last_name" }) lastName!: string;
  @Column({ type: "enum", enum: UserRole, default: UserRole.APPLICANT }) role!: UserRole;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "auth_db",
  synchronize: true,
  entities: [User],
});

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth" }));

  app.post("/auth/register", async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ message: "Не все поля заполнены" });
    if (await repo.findOneBy({ email }))
      return res.status(409).json({ message: "Email занят" });
    const user = repo.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      firstName,
      lastName,
      role: role === UserRole.EMPLOYER ? UserRole.EMPLOYER : UserRole.APPLICANT,
    });
    await repo.save(user);
    const token = jwt.sign({ userId: user.id, email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ token, user: { id: user.id, email, role: user.role } });
  });

  app.post("/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await repo.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: "Неверный email или пароль" });
    const token = jwt.sign({ userId: user.id, email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, user: { id: user.id, email, role: user.role } });
  });

  // Внутренние эндпоинты для межсервисного взаимодействия
  app.post("/internal/verify-token", (req: Request, res: Response) => {
    try {
      const payload = jwt.verify(req.body.token, JWT_SECRET);
      res.json(payload);
    } catch {
      res.status(401).json({ message: "Невалидный токен" });
    }
  });

  app.get("/internal/users/:id", async (req: Request, res: Response) => {
    const user = await repo.findOneBy({ id: parseInt(req.params.id, 10) });
    if (!user) return res.status(404).json({ message: "Не найден" });
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  });

  const PORT = parseInt(process.env.PORT || "3001", 10);
  app.listen(PORT, () => console.log(`auth-service on ${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
