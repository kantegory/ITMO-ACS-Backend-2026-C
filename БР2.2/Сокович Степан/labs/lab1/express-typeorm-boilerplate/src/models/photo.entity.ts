import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { EstateForRent } from './estate-for-rent.entity';

@Entity('photos')
export class Photo extends BaseEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({
        name: 'property_id',
        type: 'bigint',
    })
    propertyId: string;

    @Column({
        name: 'photo_addr',
        type: 'text',
    })
    photoAddr: string;

    @ManyToOne(() => EstateForRent, (estate) => estate.photos, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'property_id' })
    property: EstateForRent;
}
