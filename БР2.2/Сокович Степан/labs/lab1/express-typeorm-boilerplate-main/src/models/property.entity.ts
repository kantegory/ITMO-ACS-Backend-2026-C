import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { EstateType } from './estate-type.entity';
import { Amenity } from './amenity.entity';

@Entity('estate_for_rent')
export class Property extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'text', nullable: false })
    name: string;

    @Column({ type: 'integer', nullable: false })
    price: number;

    @Column({ type: 'integer', nullable: true })
    deposit: number | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'bigint', name: 'owner_id', nullable: false })
    ownerId: number;

    @Column({ type: 'text', nullable: false })
    city: string;

    @Column({ type: 'text', nullable: false })
    address: string;

    @Column({ type: 'smallint', name: 'type_id', nullable: false })
    typeId: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @ManyToOne(() => EstateType, { nullable: false })
    @JoinColumn({ name: 'type_id' })
    type: EstateType;

    @ManyToMany(() => Amenity, { eager: true })
    @JoinTable({
        name: 'property_amenities',
        joinColumn: { name: 'property_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
    })
    amenities: Amenity[];
}
