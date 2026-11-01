import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("restaurant_cuisines")
export class RestaurantCuisine {
  @PrimaryColumn("uuid")
  restaurant_id!: string;

  @PrimaryColumn("uuid")
  cuisine_id!: string;
}
