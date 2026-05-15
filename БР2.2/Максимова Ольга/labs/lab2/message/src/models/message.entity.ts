import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("messages")
@Index(["sender_id"], { unique: false })
@Index(["receiver_id"], { unique: false })
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  sender_id!: string;

  @Column({ type: "uuid" })
  receiver_id!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "uuid", nullable: true })
  accommodation_id?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updated_at!: Date;
}
