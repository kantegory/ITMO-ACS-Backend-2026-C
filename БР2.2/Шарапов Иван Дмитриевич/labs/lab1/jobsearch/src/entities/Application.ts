import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Vacancy } from "./Vacancy";
import { Resume } from "./Resume";
import { User } from "./User";

export enum ApplicationStatus {
  PENDING = "pending",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

@Entity("applications")
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "cover_letter", type: "text", nullable: true })
  coverLetter?: string;

  @Column({
    type: "enum",
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status!: ApplicationStatus;

  @ManyToOne(() => Vacancy, (vacancy) => vacancy.applications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vacancy_id" })
  vacancy!: Vacancy;

  @Column({ name: "vacancy_id" })
  vacancyId!: number;

  @ManyToOne(() => Resume, (resume) => resume.applications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "resume_id" })
  resume!: Resume;

  @Column({ name: "resume_id" })
  resumeId!: number;

  @ManyToOne(() => User, (user) => user.applications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "applicant_id" })
  applicant!: User;

  @Column({ name: "applicant_id" })
  applicantId!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
