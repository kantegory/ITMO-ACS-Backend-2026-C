import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("menu_items")
export class MenuItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  restaurant_id!: string;

  @Column("varchar", { length: 150 })
  name!: string;

  @Column("text", { nullable: true })
  description!: string;

  @Column("integer")
  price!: number;

  @Column("varchar", { length: 50, nullable: true })
  category!: string;

  @Column("varchar", { length: 255, nullable: true })
  photo_url!: string;

  @Column("boolean", { nullable: true })
  is_available!: boolean;
}
