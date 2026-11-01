import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("cities")
export class City {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { length: 100 })
  name!: string;

  @Column("varchar", { length: 100, nullable: true })
  country!: string;
}
