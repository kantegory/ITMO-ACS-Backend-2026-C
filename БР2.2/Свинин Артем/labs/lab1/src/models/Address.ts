import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("addresses")
export class Address {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  country!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ length: 100, nullable: true })
  district?: string;

  @Column({ length: 20 })
  houseNumber!: string;

  @Column({ length: 20, nullable: true })
  apartment?: string;

  @Column({ length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: "float", nullable: true })
  lat?: number;

  @Column({ type: "float", nullable: true })
  lon?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  get fullAddress(): string {
    const parts = [
      this.country,
      this.city,
      this.district,
      `дом ${this.houseNumber}`,
      this.apartment ? `кв. ${this.apartment}` : undefined,
    ].filter(Boolean);

    return parts.join(", ");
  }
}
