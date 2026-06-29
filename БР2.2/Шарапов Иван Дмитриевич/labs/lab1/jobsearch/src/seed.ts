import "reflect-metadata";
import bcrypt from "bcryptjs";
import { AppDataSource } from "./data-source";
import { User, UserRole } from "./entities/User";
import { Company } from "./entities/Company";
import { Vacancy, ExperienceLevel, EmploymentType } from "./entities/Vacancy";
import { Resume } from "./entities/Resume";

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const companyRepo = AppDataSource.getRepository(Company);
  const vacancyRepo = AppDataSource.getRepository(Vacancy);
  const resumeRepo = AppDataSource.getRepository(Resume);

  const hash = await bcrypt.hash("password123", 10);

  const employer = userRepo.create({
    email: "employer@example.com",
    passwordHash: hash,
    firstName: "Иван",
    lastName: "Работодатель",
    role: UserRole.EMPLOYER,
  });
  await userRepo.save(employer);

  const applicant = userRepo.create({
    email: "applicant@example.com",
    passwordHash: hash,
    firstName: "Пётр",
    lastName: "Соискатель",
    role: UserRole.APPLICANT,
  });
  await userRepo.save(applicant);

  await resumeRepo.save(
    resumeRepo.create({
      userId: applicant.id,
      title: "Backend-разработчик (Node.js)",
      summary: "3 года опыта на TypeScript и Express",
      experienceYears: 3,
      skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
      desiredSalary: 200000,
    })
  );

  const company = await companyRepo.save(
    companyRepo.create({
      name: "ООО Технологии",
      description: "Аутсорс-разработка",
      website: "https://example.com",
      location: "Санкт-Петербург",
      ownerId: employer.id,
    })
  );

  await vacancyRepo.save([
    vacancyRepo.create({
      title: "Junior Node.js Developer",
      description: "Разработка REST API на Express",
      requirements: "JS/TS, базовое знание SQL",
      industry: "IT",
      salaryFrom: 80000,
      salaryTo: 120000,
      experienceLevel: ExperienceLevel.JUNIOR,
      employmentType: EmploymentType.FULL_TIME,
      location: "Санкт-Петербург",
      companyId: company.id,
    }),
    vacancyRepo.create({
      title: "Middle Backend Developer",
      description: "Микросервисы, RabbitMQ, Docker",
      requirements: "TypeScript, PostgreSQL, опыт с очередями",
      industry: "IT",
      salaryFrom: 180000,
      salaryTo: 260000,
      experienceLevel: ExperienceLevel.MIDDLE,
      employmentType: EmploymentType.REMOTE,
      location: "Удалённо",
      companyId: company.id,
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log("✅ Тестовые данные загружены");
  await AppDataSource.destroy();
}

seed().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
