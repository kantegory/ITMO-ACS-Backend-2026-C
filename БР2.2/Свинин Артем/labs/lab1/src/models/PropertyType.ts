import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// Таблица типов недвижимости
@Entity("property_types")
export class PropertyType {
  // Первичный ключ
  @PrimaryGeneratedColumn()
  id!: number;

  // Название типа, например Квартира / Дом / Студия
  @Column({ length: 100, unique: true })
  name!: string;

  // Описание типа
  // Сделаем необязательным
  @Column({ type: "text", nullable: true })
  description?: string;

  // Дата создания записи
  @CreateDateColumn()
  createdAt!: Date;

  // Дата обновления записи
  @UpdateDateColumn()
  updatedAt!: Date;
}
