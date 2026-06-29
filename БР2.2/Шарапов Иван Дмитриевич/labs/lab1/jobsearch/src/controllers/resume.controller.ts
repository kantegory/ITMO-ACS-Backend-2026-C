import { Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Resume } from "../entities/Resume";
import { HttpError } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";

const repo = () => AppDataSource.getRepository(Resume);

export async function getMyResume(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const resume = await repo().findOneBy({ userId: req.user!.userId });
    if (!resume) throw new HttpError(404, "Резюме не найдено");
    res.json(resume);
  } catch (e) {
    next(e);
  }
}

export async function upsertMyResume(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, summary, experienceYears, skills, desiredSalary } = req.body;
    if (!title) throw new HttpError(400, "Поле title обязательно");
    let resume = await repo().findOneBy({ userId: req.user!.userId });
    if (!resume) {
      resume = repo().create({ userId: req.user!.userId });
    }
    resume.title = title;
    resume.summary = summary;
    resume.experienceYears = experienceYears ?? 0;
    resume.skills = skills;
    resume.desiredSalary = desiredSalary;
    await repo().save(resume);
    res.status(201).json(resume);
  } catch (e) {
    next(e);
  }
}

export async function deleteMyResume(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const resume = await repo().findOneBy({ userId: req.user!.userId });
    if (!resume) throw new HttpError(404, "Резюме не найдено");
    await repo().remove(resume);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
