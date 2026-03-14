import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { EstateType } from './estate-type.entity';
import { Photo } from './photo.entity';
import { Deal } from './deal.entity';

import { ManyToMany, JoinTable } from 'typeorm';
import { Amenity } from './amentity.entity';

@Entity('estate_for_rent')
export class EstateForRent extends BaseEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @Column({
        name: 'name',
        type: 'text',
    })
    name: string;

    @Column({
        name: 'price',
        type: 'integer',
    })
    price: number;

    @Column({
        name: 'deposit',
        type: 'integer',
    })
    deposit: number;

    @Column({
        name: 'description',
        type: 'text',
    })
    description: string;

    @Column({
        name: 'city',
        type: 'text',
    })
    city: string;

    @Column({
        name: 'address',
        type: 'text',
    })
    address: string;

    @Column({
        name: 'owner_id',
        type: 'bigint',
    })
    ownerId: string;

    @Column({
        name: 'type_id',
        type: 'smallint',
    })
    typeId: number;

    @ManyToOne(() => User, (user) => user.estates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @ManyToOne(() => EstateType, (estateType) => estateType.estates, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'type_id' })
    type: EstateType;

    @OneToMany(() => Photo, (photo) => photo.property)
    photos: Photo[];

    @OneToMany(() => Deal, (deal) => deal.estate)
    deals: Deal[];

    @ManyToMany(() => Amenity, (amenity) => amenity.estates)
    @JoinTable({
        name: 'estate_amenities',
        joinColumn: {
            name: 'estate_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'amenity_id',
            referencedColumnName: 'id',
        },
    })
    amenities: Amenity[];
}
