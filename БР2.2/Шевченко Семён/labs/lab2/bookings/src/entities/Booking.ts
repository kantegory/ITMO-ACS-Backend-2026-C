import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  user_id!: string;

  @Column("uuid")
  table_id!: string;

  @Column("uuid")
  time_slot_id!: string;

  @Column("date")
  booking_date!: string;

  @Column("integer")
  guests_count!: number;

  @Column("enum", { enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"], enumName: "STATUSES" })
  status!: string;

  @Column("text", { nullable: true })
  comment!: string;

  @Column("timestamp", { nullable: true })
  created_at!: Date;
}
