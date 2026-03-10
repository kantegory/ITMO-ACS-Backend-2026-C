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
import { Booking } from "./Booking";

@Entity("chats")
export class Chat {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Владелец объекта недвижимости
  @Column({ name: "owner_id" })
  ownerId!: number;

  // Гость / арендатор
  @Column({ name: "occupier_id" })
  occupierId!: number;

  // Объект недвижимости
  @Column({ name: "property_id" })
  propertyId!: number;

  // Бронирование — необязательное поле
  @Column({ name: "booking_id", nullable: true })
  bookingId?: number;

  // Дата создания чата
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Время последнего сообщения
  @Column({ name: "last_message_at", type: "timestamp", nullable: true })
  lastMessageAt?: Date;

  // Связь с владельцем
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  // Связь с гостем
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "occupier_id" })
  occupier!: User;

  // Связь с объектом недвижимости
  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: "property_id" })
  property!: Property;

  // Связь с бронированием
  // Так как bookingId необязателен, и связь тоже может отсутствовать
  @ManyToOne(() => Booking, { eager: true, nullable: true })
  @JoinColumn({ name: "booking_id" })
  booking?: Booking;
}