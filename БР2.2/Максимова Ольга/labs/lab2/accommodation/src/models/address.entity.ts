import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Accommodation } from "./accommodation.entity";

@Entity("addresses")
export class Address {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  city!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  district?: string;

  @Column({ type: "varchar", length: 200 })
  street!: string;

  @Column({ type: "varchar", length: 20 })
  house_num!: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  building?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updated_at!: Date;

  @OneToMany(() => Accommodation, (accommodation) => accommodation.address)
  accommodations!: Accommodation[];
}