import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("time_slots")
export class TimeSlot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  restaurant_id!: string;

  @Column("time")
  start_time!: string;

  @Column("time")
  end_time!: string;

  @Column("integer", { nullable: true })
  duration_minutes!: number;
}
