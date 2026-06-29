import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Application } from "./Application";

@Entity("resumes")
export class Resume {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  summary?: string;

  @Column({ name: "experience_years", type: "int", default: 0 })
  experienceYears!: number;

  @Column({ type: "simple-array", nullable: true })
  skills?: string[];

  @Column({ name: "desired_salary", type: "int", nullable: true })
  desiredSalary?: number;

  @OneToOne(() => User, (user) => user.resume, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id" })
  userId!: number;

  @OneToMany(() => Application, (application) => application.resume)
  applications?: Application[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
