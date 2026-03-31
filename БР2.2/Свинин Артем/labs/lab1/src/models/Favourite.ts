import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { User } from "./User";
import { Property } from "./Property";

@Entity("favourites")
export class Favourite {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Пользователь, который добавил в избранное
  @Column({ name: "user_id" })
  userId!: number;

  // Объект недвижимости
  @Column({ name: "property_id" })
  propertyId!: number;

  // Дата добавления в избранное
  @CreateDateColumn({ name: "added_at" })
  addedAt!: Date;

  // Связь с пользователем
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  // Связь с объектом недвижимости
  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: "property_id" })
  property!: Property;
}