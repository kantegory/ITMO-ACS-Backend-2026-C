import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Chat } from "./Chat";
import { User } from "./User";

@Entity("messages")
export class Message {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Внешний ключ на чат
  @Column({ name: "chat_id" })
  chatId!: number;

  // Внешний ключ на отправителя
  @Column({ name: "sender_id" })
  senderId!: number;

  // Текст сообщения
  @Column({ name: "content", type: "text" })
  content!: string;

  // Дата и время отправки
  @CreateDateColumn({ name: "sent_at" })
  sentAt!: Date;

  // Прочитано ли сообщение
  @Column({ name: "is_read", default: false })
  isRead!: boolean;

  // Дата и время прочтения
  @Column({ name: "read_at", type: "timestamp", nullable: true })
  readAt?: Date;

  // Связь с чатом
  @ManyToOne(() => Chat, { eager: true })
  @JoinColumn({ name: "chat_id" })
  chat!: Chat;

  // Связь с отправителем
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "sender_id" })
  sender!: User;
}