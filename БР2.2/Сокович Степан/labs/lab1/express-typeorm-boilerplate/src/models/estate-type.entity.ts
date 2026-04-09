import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
} from 'typeorm';
import { EstateForRent } from './estate-for-rent.entity';

@Entity('estate_types')
export class EstateType extends BaseEntity {
    @PrimaryGeneratedColumn({
        type: 'smallint',
    })
    id: number;

    @Column({
        name: 'name',
        type: 'varchar',
        length: 255,
    })
    name: string;

    @OneToMany(() => EstateForRent, (estate) => estate.type)
    estates: EstateForRent[];
}
