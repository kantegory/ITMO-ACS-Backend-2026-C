import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PropertyFacility } from './property-facility.entity';

@Entity()
export class Facility extends BaseEntity{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text', unique: true })
    name!: string;

    @OneToMany(() => PropertyFacility, pf => pf.facility)
    propertyFacilities!: PropertyFacility[];
}