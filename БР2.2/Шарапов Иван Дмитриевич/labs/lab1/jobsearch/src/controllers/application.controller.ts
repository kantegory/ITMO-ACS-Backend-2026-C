import { Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Application, ApplicationStatus } from "../entities/Application";
import { Vacancy } from "../entities/Vacancy";
import { Resume } from "../entities/Resume";
import { HttpError } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";

const repo = () => AppDataSource.getRepository(Application);
const vacancyRepo = () => AppDataSource.getRepository(Vacancy);
const resumeRepo = () => AppDataSource.getRepository(Resume);

/** Соискатель откликается на вакансию */
export async function apply(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vacancyId = parseInt(req.params.vacancyId, 10);
    const { coverLetter } = req.body;

    const vacancy = await vacancyRepo().findOneBy({ id: vacancyId });
    if (!vacancy) throw new HttpError(404, "Вакансия не найдена");

    const resume = await resumeRepo().findOneBy({ userId: req.user!.userId });
    if (!resume) {
      throw new HttpError(400, "Сначала создайте резюме, чтобы откликаться");
    }

    const existing = await repo().findOneBy({
      vacancyId,
      applicantId: req.user!.userId,
    });
    if (existing) throw new HttpError(409, "Вы уже откликались на эту вакансию");

    const application = repo().create({
      vacancyId,
      resumeId: resume.id,
      applicantId: req.user!.userId,
      coverLetter,
      status: ApplicationStatus.PENDING,
    });
    await repo().save(application);
    res.status(201).json(application);
  } catch (e) {
    next(e);
  }
}

/** История откликов соискателя */
export async function myApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const applications = await repo().find({
      where: { applicantId: req.user!.userId },
      relations: { vacancy: { company: true } },
      order: { createdAt: "DESC" },
    });
    res.json(applications);
  } catch (e) {
    next(e);
  }
}

/** Отклики на конкретную вакансию (для работодателя) */
export async function vacancyApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vacancyId = parseInt(req.params.vacancyId, 10);
    const vacancy = await vacancyRepo().findOne({
      where: { id: vacancyId },
      relations: { company: true },
    });
    if (!vacancy) throw new HttpError(404, "Вакансия не найдена");
    if (vacancy.company.ownerId !== req.user!.userId) {
      throw new HttpError(403, "Это не ваша вакансия");
    }
    const applications = await repo().find({
      where: { vacancyId },
      relations: { resume: true, applicant: true },
      order: { createdAt: "DESC" },
    });
    res.json(applications);
  } catch (e) {
    next(e);
  }
}

/** Работодатель меняет статус отклика */
export async function updateStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!Object.values(ApplicationStatus).includes(status)) {
      throw new HttpError(400, "Недопустимый статус");
    }
    const application = await repo().findOne({
      where: { id },
      relations: { vacancy: { company: true } },
    });
    if (!application) throw new HttpError(404, "Отклик не найден");
    if (application.vacancy.company.ownerId !== req.user!.userId) {
      throw new HttpError(403, "Это не ваша вакансия");
    }
    application.status = status;
    await repo().save(application);
    res.json(application);
  } catch (e) {
    next(e);
  }
}
