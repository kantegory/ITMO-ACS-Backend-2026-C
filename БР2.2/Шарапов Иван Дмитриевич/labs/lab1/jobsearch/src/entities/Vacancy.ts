import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Company } from "./Company";
import { Application } from "./Application";

export enum ExperienceLevel {
  JUNIOR = "junior",
  MIDDLE = "middle",
  SENIOR = "senior",
  LEAD = "lead",
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  REMOTE = "remote",
  INTERNSHIP = "internship",
}

@Entity("vacancies")
export class Vacancy {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text", nullable: true })
  requirements?: string;

  @Column()
  industry!: string;

  @Column({ name: "salary_from", type: "int", nullable: true })
  salaryFrom?: number;

  @Column({ name: "salary_to", type: "int", nullable: true })
  salaryTo?: number;

  @Column({
    name: "experience_level",
    type: "enum",
    enum: ExperienceLevel,
    default: ExperienceLevel.JUNIOR,
  })
  experienceLevel!: ExperienceLevel;

  @Column({
    name: "employment_type",
    type: "enum",
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  employmentType!: EmploymentType;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @ManyToOne(() => Company, (company) => company.vacancies, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @Column({ name: "company_id" })
  companyId!: number;

  @OneToMany(() => Application, (application) => application.vacancy)
  applications?: Application[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
