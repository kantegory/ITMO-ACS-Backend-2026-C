import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Vacancy } from "./Vacancy";

@Entity("companies")
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  location?: string;

  @ManyToOne(() => User, (user) => user.companies, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @Column({ name: "owner_id" })
  ownerId!: number;

  @OneToMany(() => Vacancy, (vacancy) => vacancy.company)
  vacancies?: Vacancy[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
