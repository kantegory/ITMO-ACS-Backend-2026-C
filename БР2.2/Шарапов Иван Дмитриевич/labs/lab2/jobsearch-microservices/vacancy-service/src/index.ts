import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";

@Entity("companies")
class Company {
  @PrimaryGeneratedColumn() id!: number;
  @Column() name!: string;
  @Column({ type: "text", nullable: true }) description?: string;
  @Column({ nullable: true }) website?: string;
  @Column({ nullable: true }) location?: string;
  @Column({ name: "owner_id" }) ownerId!: number; // ссылка на auth_db.users
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("vacancies")
class Vacancy {
  @PrimaryGeneratedColumn() id!: number;
  @Column() title!: string;
  @Column({ type: "text" }) description!: string;
  @Column({ type: "text", nullable: true }) requirements?: string;
  @Column() industry!: string;
  @Column({ name: "salary_from", type: "int", nullable: true }) salaryFrom?: number;
  @Column({ name: "salary_to", type: "int", nullable: true }) salaryTo?: number;
  @Column({ name: "experience_level", default: "junior" }) experienceLevel!: string;
  @Column({ name: "employment_type", default: "full_time" }) employmentType!: string;
  @Column({ nullable: true }) location?: string;
  @Column({ name: "is_active", default: true }) isActive!: boolean;
  @Column({ name: "company_id" }) companyId!: number;
  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company!: Company;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "vacancy_db",
  synchronize: true,
  entities: [Company, Vacancy],
});

interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer "))
    return res.status(401).json({ message: "Требуется авторизация" });
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET) as any;
    next();
  } catch {
    res.status(401).json({ message: "Невалидный токен" });
  }
}

async function main() {
  await AppDataSource.initialize();
  const companies = AppDataSource.getRepository(Company);
  const vacancies = AppDataSource.getRepository(Vacancy);
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "vacancy" }));

  // Компании (работодатель)
  app.post("/companies", auth, async (req: AuthRequest, res) => {
    if (!req.body.name) return res.status(400).json({ message: "name обязателен" });
    const c = companies.create({ ...req.body, ownerId: req.user!.userId });
    await companies.save(c);
    res.status(201).json(c);
  });

  // Поиск вакансий с фильтрацией
  app.get("/vacancies", async (req: Request, res: Response) => {
    const { q, industry, experienceLevel, salaryMin, location, page = "1", limit = "20" } =
      req.query as Record<string, string>;
    const qb = vacancies
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.company", "company")
      .where("v.isActive = true");
    if (q) qb.andWhere("(v.title ILIKE :q OR v.description ILIKE :q)", { q: `%${q}%` });
    if (industry) qb.andWhere("v.industry = :industry", { industry });
    if (experienceLevel)
      qb.andWhere("v.experienceLevel = :experienceLevel", { experienceLevel });
    if (salaryMin)
      qb.andWhere("(v.salaryTo >= :s OR v.salaryTo IS NULL)", { s: parseInt(salaryMin, 10) });
    if (location) qb.andWhere("v.location ILIKE :loc", { loc: `%${location}%` });
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;
    const [items, total] = await qb
      .orderBy("v.createdAt", "DESC")
      .skip(skip)
      .take(take)
      .getManyAndCount();
    res.json({ total, items });
  });

  app.get("/vacancies/:id", async (req, res) => {
    const v = await vacancies.findOne({
      where: { id: parseInt(req.params.id, 10) },
      relations: { company: true },
    });
    if (!v) return res.status(404).json({ message: "Вакансия не найдена" });
    res.json(v);
  });

  app.post("/vacancies", auth, async (req: AuthRequest, res) => {
    const { companyId, title, description, industry } = req.body;
    const company = await companies.findOneBy({ id: companyId });
    if (!company) return res.status(404).json({ message: "Компания не найдена" });
    if (company.ownerId !== req.user!.userId)
      return res.status(403).json({ message: "Не ваша компания" });
    if (!title || !description || !industry)
      return res.status(400).json({ message: "title, description, industry обязательны" });
    const v = vacancies.create({ ...req.body });
    await vacancies.save(v);
    res.status(201).json(v);
  });

  // Внутренний эндпоинт для application-service
  app.get("/internal/vacancies/:id", async (req, res) => {
    const v = await vacancies.findOne({
      where: { id: parseInt(req.params.id, 10) },
      relations: { company: true },
    });
    if (!v) return res.status(404).json({ message: "Не найдена" });
    res.json({ id: v.id, title: v.title, companyId: v.companyId, ownerId: v.company.ownerId });
  });

  const PORT = parseInt(process.env.PORT || "3002", 10);
  app.listen(PORT, () => console.log(`vacancy-service on ${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
