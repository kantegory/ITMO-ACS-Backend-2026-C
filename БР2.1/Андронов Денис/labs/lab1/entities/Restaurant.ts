import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from "typeorm";

@Entity("restaurants")
export class Restaurant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  city_id!: number;

  @Column()
  address!: string;

  @Column()
  price_category!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true, type: "float" })
  average_rating?: number;
}