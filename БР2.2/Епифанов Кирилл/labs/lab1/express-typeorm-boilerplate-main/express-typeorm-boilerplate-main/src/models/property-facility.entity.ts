import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Property } from './property.entity';
import { Facility } from './facility.entity';

@Entity()
export class PropertyFacility {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column( {type: 'float'} )
    amount!: number;

    @ManyToOne(() => Property, property => property.facilities, { onDelete: 'CASCADE' })
    property!: Property;

    @ManyToOne(() => Facility, facility => facility.propertyFacilities, { eager: true })
    facility!: Facility;
}