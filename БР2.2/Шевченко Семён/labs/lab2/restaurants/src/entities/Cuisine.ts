import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("cuisines")
export class Cuisine {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { length: 50 })
  name!: string;

  @Column("varchar", { length: 255, nullable: true })
  icon_url!: string;
}
