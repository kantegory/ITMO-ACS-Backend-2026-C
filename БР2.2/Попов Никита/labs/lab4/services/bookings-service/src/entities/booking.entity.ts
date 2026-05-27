import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "bookings" })
export class BookingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  restaurantId!: string;

  @Column({ type: "timestamptz" })
  fromDate!: Date;

  @Column({ type: "timestamptz" })
  toDate!: Date;

  @Column({ type: "int" })
  guestCount!: number;

  @Column({ default: "CONFIRMED" })
  status!: string;
}
