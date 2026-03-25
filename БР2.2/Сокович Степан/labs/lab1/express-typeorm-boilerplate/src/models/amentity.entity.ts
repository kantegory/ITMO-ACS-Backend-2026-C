import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToMany,
} from 'typeorm';

import { EstateForRent } from './estate-for-rent.entity';

@Entity('amenities')
export class Amenity extends BaseEntity {

    @PrimaryGeneratedColumn({ type: 'smallint' })
    id: number;

    @Column({
        name: 'name',
        type: 'varchar',
        length: 255,
    })
    name: string;

    @ManyToMany(() => EstateForRent, (estate) => estate.amenities)
    estates: EstateForRent[];
}
