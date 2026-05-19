import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Property } from "./Property";

@Entity("images")
export class Image {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Внешний ключ на объект недвижимости
  @Column({ name: "property_id" })
  propertyId!: number;

  // Ссылка на изображение
  @Column({ name: "image_url", type: "text" })
  imageUrl!: string;

  // Является ли изображение главным
  @Column({ name: "is_main", default: false })
  isMain!: boolean;

  // Дата создания
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Связь с объектом недвижимости
  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: "property_id" })
  property!: Property;
}
