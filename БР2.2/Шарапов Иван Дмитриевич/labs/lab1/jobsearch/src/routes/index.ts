import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import * as auth from "../controllers/auth.controller";
import * as resume from "../controllers/resume.controller";
import * as company from "../controllers/company.controller";
import * as vacancy from "../controllers/vacancy.controller";
import * as application from "../controllers/application.controller";

const router = Router();

// --- Auth ---
router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/me", authenticate, auth.me);

// --- Resume (личный кабинет соискателя) ---
router.get("/resume", authenticate, authorize(UserRole.APPLICANT), resume.getMyResume);
router.put("/resume", authenticate, authorize(UserRole.APPLICANT), resume.upsertMyResume);
router.delete("/resume", authenticate, authorize(UserRole.APPLICANT), resume.deleteMyResume);

// --- Companies (кабинет работодателя) ---
router.get("/companies", authenticate, authorize(UserRole.EMPLOYER), company.listMyCompanies);
router.post("/companies", authenticate, authorize(UserRole.EMPLOYER), company.createCompany);
router.put("/companies/:id", authenticate, authorize(UserRole.EMPLOYER), company.updateCompany);
router.delete("/companies/:id", authenticate, authorize(UserRole.EMPLOYER), company.deleteCompany);

// --- Vacancies ---
router.get("/vacancies", vacancy.searchVacancies); // публичный поиск с фильтрацией
router.get("/vacancies/:id", vacancy.getVacancy); // публичная страница вакансии
router.post("/vacancies", authenticate, authorize(UserRole.EMPLOYER), vacancy.createVacancy);
router.put("/vacancies/:id", authenticate, authorize(UserRole.EMPLOYER), vacancy.updateVacancy);
router.delete("/vacancies/:id", authenticate, authorize(UserRole.EMPLOYER), vacancy.deleteVacancy);

// --- Applications (отклики) ---
router.post(
  "/vacancies/:vacancyId/apply",
  authenticate,
  authorize(UserRole.APPLICANT),
  application.apply
);
router.get(
  "/applications/my",
  authenticate,
  authorize(UserRole.APPLICANT),
  application.myApplications
);
router.get(
  "/vacancies/:vacancyId/applications",
  authenticate,
  authorize(UserRole.EMPLOYER),
  application.vacancyApplications
);
router.patch(
  "/applications/:id/status",
  authenticate,
  authorize(UserRole.EMPLOYER),
  application.updateStatus
);

export default router;
