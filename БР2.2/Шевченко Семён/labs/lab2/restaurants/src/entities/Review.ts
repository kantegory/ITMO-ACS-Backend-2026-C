import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  user_id!: string;

  @Column("uuid")
  restaurant_id!: string;

  @Column("uuid", { nullable: true })
  booking_id!: string;

  @Column("integer")
  rating!: number;

  @Column("text", { nullable: true })
  text!: string;

  @Column("timestamp", { nullable: true })
  created_at!: Date;
}
