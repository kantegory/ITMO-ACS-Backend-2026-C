import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

export enum UserRole {
  ADMIN = "ADMIN",
  OWNER = "OWNER",
  CLIENT = "CLIENT"
}

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, length: 300 })
  email!: string;

  @Column({ length: 300 })
  password!: string;

  @Column({ length: 150 })
  firstName!: string;

  @Column({ length: 150 })
  lastName!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.CLIENT })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;
}
