import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { length: 255 })
  email!: string;

  @Column("varchar", { length: 255, select: false })
  password_hash!: string;

  @Column("varchar", { length: 100 })
  name!: string;

  @Column("varchar", { length: 20, nullable: true })
  phone!: string;

  @Column("enum", { enum: ["USER", "RESTAURANT_ADMIN", "SUPER_ADMIN"], enumName: "roles" })
  role!: string;

  @Column("timestamp", { nullable: true })
  created_at!: Date;

  @Column("timestamp", { nullable: true })
  updated_at!: Date;
}
