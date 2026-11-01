import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("restaurants")
export class Restaurant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  admin_id!: string;

  @Column("uuid")
  city_id!: string;

  @Column("varchar", { length: 200 })
  name!: string;

  @Column("text", { nullable: true })
  description!: string;

  @Column("varchar", { length: 255 })
  address!: string;

  @Column("decimal", { precision: 10, scale: 8, nullable: true })
  latitude!: string;

  @Column("decimal", { precision: 11, scale: 8, nullable: true })
  longitude!: string;

  @Column("integer", { nullable: true })
  avg_price!: number;

  @Column("decimal", { precision: 3, scale: 2, nullable: true })
  rating!: string;

  @Column("jsonb", { nullable: true })
  working_hours!: Record<string, string>;

  @Column("timestamp", { nullable: true })
  created_at!: Date;

  @Column("timestamp", { nullable: true })
  updated_at!: Date;
}
