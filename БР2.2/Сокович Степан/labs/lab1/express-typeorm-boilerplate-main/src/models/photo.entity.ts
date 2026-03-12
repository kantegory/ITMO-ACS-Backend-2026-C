import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('photos')
export class Photo extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'bigint', name: 'property_id', nullable: false })
    propertyId: number;

    @Column({ type: 'text', name: 'photo_addr', nullable: false })
    photoAddr: string;

    @ManyToOne(() => Property, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property: Property;
}
