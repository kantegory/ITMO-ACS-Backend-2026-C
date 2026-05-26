import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "restaurants" })
export class RestaurantEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "int" })
  capacity!: number;

  @Column()
  priceLevel!: string;

  @Column({ default: "" })
  cuisine!: string;

  @Column({ default: "" })
  city!: string;

  @Column({ type: "simple-array", default: "" })
  photos!: string[];

  @Column({ type: "float", default: 0 })
  rating!: number;
}
