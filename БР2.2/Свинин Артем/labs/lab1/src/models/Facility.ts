import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("facilities")
export class Facility {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Название удобства
  @Column({ name: "type", length: 100, unique: true })
  type!: string;

  // Дата создания
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Дата обновления
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}