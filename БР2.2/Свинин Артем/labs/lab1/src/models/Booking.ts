import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Property } from "./Property";
import { User } from "./User";

// Возможные статусы бронирования
export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

@Entity("bookings")
export class Booking {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Внешний ключ на объект недвижимости
  @Column({ name: "property_id" })
  propertyId!: number;

  // Внешний ключ на арендатора
  @Column({ name: "occupier_id" })
  occupierId!: number;

  // Дата начала аренды
  @Column({ name: "start_date", type: "date" })
  startDate!: string;

  // Дата окончания аренды
  @Column({ name: "end_date", type: "date" })
  endDate!: string;

  // Итоговая стоимость бронирования
  @Column({ name: "total_price", type: "decimal", precision: 10, scale: 2 })
  totalPrice!: string;

  // Статус бронирования
  @Column({
    name: "status",
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  // Количество гостей
  @Column({ name: "guests_count", type: "int" })
  guestsCount!: number;

  // Дополнительный комментарий/пожелание
  @Column({ name: "special_request", type: "text", nullable: true })
  specialRequest?: string;

  // Причина отмены
  @Column({ name: "cancellation_reason", type: "text", nullable: true })
  cancellationReason?: string;

  // Связь с объектом недвижимости
  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: "property_id" })
  property!: Property;

  // Связь с арендатором
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "occupier_id" })
  occupier!: User;

  // Дата создания
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Дата обновления
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
