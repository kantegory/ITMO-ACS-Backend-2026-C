import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Vacancy } from "../entities/Vacancy";
import { Company } from "../entities/Company";
import { HttpError } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";

const repo = () => AppDataSource.getRepository(Vacancy);
const companyRepo = () => AppDataSource.getRepository(Company);

/**
 * Публичный поиск вакансий с фильтрацией:
 * ?q=  &industry=  &experienceLevel=  &salaryMin=  &location=  &page=  &limit=
 */
export async function searchVacancies(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      q,
      industry,
      experienceLevel,
      employmentType,
      salaryMin,
      location,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const qb = repo()
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.company", "company")
      .where("v.isActive = :active", { active: true });

    if (q) {
      qb.andWhere("(v.title ILIKE :q OR v.description ILIKE :q)", { q: `%${q}%` });
    }
    if (industry) qb.andWhere("v.industry = :industry", { industry });
    if (experienceLevel)
      qb.andWhere("v.experienceLevel = :experienceLevel", { experienceLevel });
    if (employmentType)
      qb.andWhere("v.employmentType = :employmentType", { employmentType });
    if (salaryMin)
      qb.andWhere("(v.salaryTo >= :salaryMin OR v.salaryTo IS NULL)", {
        salaryMin: parseInt(salaryMin, 10),
      });
    if (location) qb.andWhere("v.location ILIKE :location", { location: `%${location}%` });

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [items, total] = await qb
      .orderBy("v.createdAt", "DESC")
      .skip(skip)
      .take(take)
      .getManyAndCount();

    res.json({ total, page: parseInt(page, 10) || 1, limit: take, items });
  } catch (e) {
    next(e);
  }
}

export async function getVacancy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const vacancy = await repo().findOne({
      where: { id },
      relations: { company: true },
    });
    if (!vacancy) throw new HttpError(404, "Вакансия не найдена");
    res.json(vacancy);
  } catch (e) {
    next(e);
  }
}

export async function createVacancy(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId, ...data } = req.body;
    const company = await companyRepo().findOneBy({ id: companyId });
    if (!company) throw new HttpError(404, "Компания не найдена");
    if (company.ownerId !== req.user!.userId) {
      throw new HttpError(403, "Это не ваша компания");
    }
    if (!data.title || !data.description || !data.industry) {
      throw new HttpError(400, "title, description, industry обязательны");
    }
    const vacancy = repo().create({ ...data, companyId });
    await repo().save(vacancy);
    res.status(201).json(vacancy);
  } catch (e) {
    next(e);
  }
}

export async function updateVacancy(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const vacancy = await repo().findOne({
      where: { id },
      relations: { company: true },
    });
    if (!vacancy) throw new HttpError(404, "Вакансия не найдена");
    if (vacancy.company.ownerId !== req.user!.userId) {
      throw new HttpError(403, "Это не ваша вакансия");
    }
    Object.assign(vacancy, req.body);
    await repo().save(vacancy);
    res.json(vacancy);
  } catch (e) {
    next(e);
  }
}

export async function deleteVacancy(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const vacancy = await repo().findOne({
      where: { id },
      relations: { company: true },
    });
    if (!vacancy) throw new HttpError(404, "Вакансия не найдена");
    if (vacancy.company.ownerId !== req.user!.userId) {
      throw new HttpError(403, "Это не ваша вакансия");
    }
    await repo().remove(vacancy);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
