import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from "typeorm";

@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  restaurant_id!: number;

  @Column()
  reservation_time!: Date;

  @Column()
  guests_count!: number;

  @Column()
  status!: string;
}