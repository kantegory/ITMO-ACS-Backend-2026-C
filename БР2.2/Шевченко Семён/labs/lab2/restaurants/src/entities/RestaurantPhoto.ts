import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("restaurant_photos")
export class RestaurantPhoto {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  restaurant_id!: string;

  @Column("varchar", { length: 255 })
  url!: string;

  @Column("boolean", { nullable: true })
  is_cover!: boolean;
}
