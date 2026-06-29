import { Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { Company } from "../entities/Company";
import { HttpError } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";

const repo = () => AppDataSource.getRepository(Company);

export async function listMyCompanies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companies = await repo().findBy({ ownerId: req.user!.userId });
    res.json(companies);
  } catch (e) {
    next(e);
  }
}

export async function createCompany(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, description, website, location } = req.body;
    if (!name) throw new HttpError(400, "Поле name обязательно");
    const company = repo().create({
      name,
      description,
      website,
      location,
      ownerId: req.user!.userId,
    });
    await repo().save(company);
    res.status(201).json(company);
  } catch (e) {
    next(e);
  }
}

export async function updateCompany(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const company = await repo().findOneBy({ id });
    if (!company) throw new HttpError(404, "Компания не найдена");
    if (company.ownerId !== req.user!.userId) {
      throw new HttpError(403, "Это не ваша компания");
    }
    Object.assign(company, req.body);
    await repo().save(company);
    res.json(company);
  } catch (e) {
    next(e);
  }
}

export async function deleteCompany(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const company = await repo().findOneBy({ id });
    if (!company) throw new HttpError(404, "Компания не найдена");
    if (company.ownerId !== req.user!.userId) {
      throw new HttpError(403, "Это не ваша компания");
    }
    await repo().remove(company);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
