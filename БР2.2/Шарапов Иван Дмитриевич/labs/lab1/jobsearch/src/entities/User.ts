import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Resume } from "./Resume";
import { Company } from "./Company";
import { Application } from "./Application";

export enum UserRole {
  APPLICANT = "applicant",
  EMPLOYER = "employer",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({ name: "first_name" })
  firstName!: string;

  @Column({ name: "last_name" })
  lastName!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.APPLICANT })
  role!: UserRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToOne(() => Resume, (resume) => resume.user)
  resume?: Resume;

  @OneToMany(() => Company, (company) => company.owner)
  companies?: Company[];

  @OneToMany(() => Application, (application) => application.applicant)
  applications?: Application[];
}
