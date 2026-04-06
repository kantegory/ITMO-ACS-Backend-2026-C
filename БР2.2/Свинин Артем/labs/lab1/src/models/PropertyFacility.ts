import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";

import { Property } from "./Property";
import { Facility } from "./Facility";

@Entity("property_facilities")
export class PropertyFacility {
  // Первичный ключ
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // Внешний ключ на объект недвижимости
  @Column({ name: "property_id" })
  propertyId!: number;

  // Внешний ключ на удобство
  @Column({ name: "facility_id" })
  facilityId!: number;

  // Дата создания связи
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Связь с объектом недвижимости
  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: "property_id" })
  property!: Property;

  // Связь с удобством
  @ManyToOne(() => Facility, { eager: true })
  @JoinColumn({ name: "facility_id" })
  facility!: Facility;
}