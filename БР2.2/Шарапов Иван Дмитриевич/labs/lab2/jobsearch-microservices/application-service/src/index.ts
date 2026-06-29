import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
import {
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { connectRabbit, publishApplicationCreated } from "./rabbitmq";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";
const VACANCY_SERVICE_URL = process.env.VACANCY_SERVICE_URL || "http://localhost:3002";

@Entity("resumes")
class Resume {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: "user_id" }) userId!: number;
  @Column() title!: string;
  @Column({ type: "text", nullable: true }) summary?: string;
  @Column({ name: "experience_years", type: "int", default: 0 }) experienceYears!: number;
  @Column({ type: "simple-array", nullable: true }) skills?: string[];
  @Column({ name: "desired_salary", type: "int", nullable: true }) desiredSalary?: number;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("applications")
class Application {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: "vacancy_id" }) vacancyId!: number;
  @Column({ name: "resume_id" }) resumeId!: number;
  @Column({ name: "applicant_id" }) applicantId!: number;
  @Column({ name: "cover_letter", type: "text", nullable: true }) coverLetter?: string;
  @Column({ default: "pending" }) status!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "application_db",
  synchronize: true,
  entities: [Resume, Application],
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
  await connectRabbit();
  const resumes = AppDataSource.getRepository(Resume);
  const applications = AppDataSource.getRepository(Application);
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "application" }));

  // Резюме
  app.put("/resume", auth, async (req: AuthRequest, res) => {
    if (!req.body.title) return res.status(400).json({ message: "title обязателен" });
    let r = await resumes.findOneBy({ userId: req.user!.userId });
    if (!r) r = resumes.create({ userId: req.user!.userId });
    Object.assign(r, req.body);
    await resumes.save(r);
    res.status(201).json(r);
  });

  app.get("/resume", auth, async (req: AuthRequest, res) => {
    const r = await resumes.findOneBy({ userId: req.user!.userId });
    if (!r) return res.status(404).json({ message: "Резюме не найдено" });
    res.json(r);
  });

  // Отклик на вакансию
  app.post("/vacancies/:vacancyId/apply", auth, async (req: AuthRequest, res) => {
    const vacancyId = parseInt(req.params.vacancyId, 10);
    const resume = await resumes.findOneBy({ userId: req.user!.userId });
    if (!resume) return res.status(400).json({ message: "Сначала создайте резюме" });

    // Межсервисный синхронный вызов к vacancy-service
    let vacancy: { id: number; title: string; ownerId: number };
    try {
      const { data } = await axios.get(
        `${VACANCY_SERVICE_URL}/internal/vacancies/${vacancyId}`
      );
      vacancy = data;
    } catch {
      return res.status(404).json({ message: "Вакансия не найдена" });
    }

    const existing = await applications.findOneBy({
      vacancyId,
      applicantId: req.user!.userId,
    });
    if (existing) return res.status(409).json({ message: "Вы уже откликались" });

    const application = applications.create({
      vacancyId,
      resumeId: resume.id,
      applicantId: req.user!.userId,
      coverLetter: req.body.coverLetter,
      status: "pending",
    });
    await applications.save(application);

    // Асинхронное событие в очередь (ДЗ5)
    publishApplicationCreated({
      event: "application.created",
      applicationId: application.id,
      vacancyId,
      vacancyTitle: vacancy.title,
      applicantId: req.user!.userId,
      employerId: vacancy.ownerId,
      createdAt: application.createdAt,
    });

    res.status(201).json(application);
  });

  app.get("/applications/my", auth, async (req: AuthRequest, res) => {
    const list = await applications.find({
      where: { applicantId: req.user!.userId },
      order: { createdAt: "DESC" },
    });
    res.json(list);
  });

  const PORT = parseInt(process.env.PORT || "3003", 10);
  app.listen(PORT, () => console.log(`application-service on ${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
