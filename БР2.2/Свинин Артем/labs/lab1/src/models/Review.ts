import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Booking } from "./Booking";
import { Property } from "./Property";
import { User } from "./User";

// Тип отзыва: пока оставим только отзыв о недвижимости
export enum ReviewTargetType {
  PROPERTY = "PROPERTY",
}

@Entity("reviews")
export class Review {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Внешний ключ на бронирование
  @Column({ name: "booking_id" })
  bookingId!: number;

  // Внешний ключ на объект недвижимости
  @Column({ name: "property_id" })
  propertyId!: number;

  // Кто оставил отзыв
  @Column({ name: "reviewer_id" })
  reviewerId!: number;

  // Тип цели отзыва
  @Column({
    name: "target_type",
    type: "enum",
    enum: ReviewTargetType,
    default: ReviewTargetType.PROPERTY,
  })
  targetType!: ReviewTargetType;

  // Оценка от 1 до 5
  @Column({ name: "rating", type: "int" })
  rating!: number;

  // Текст отзыва
  @Column({ name: "comment", type: "text" })
  comment!: string;

  // Ответ владельца
  @Column({ name: "response_text", type: "text", nullable: true })
  responseText?: string;

  // Дата ответа владельца
  @Column({ name: "response_date", type: "timestamp", nullable: true })
  responseDate?: Date;

  // Связь с бронированием
  @ManyToOne(() => Booking, { eager: true })
  @JoinColumn({ name: "booking_id" })
  booking!: Booking;

  // Связь с объектом недвижимости
  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: "property_id" })
  property!: Property;

  // Связь с автором отзыва
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "reviewer_id" })
  reviewer!: User;

  // Дата создания отзыва
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}