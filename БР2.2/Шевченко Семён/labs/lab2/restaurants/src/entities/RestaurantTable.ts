import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("restaurant_tables")
export class RestaurantTable {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  restaurant_id!: string;

  @Column("integer")
  number!: number;

  @Column("integer")
  seats!: number;

  @Column("varchar", { length: 50, nullable: true })
  location!: string;

  @Column("boolean")
  is_active!: boolean;
}
