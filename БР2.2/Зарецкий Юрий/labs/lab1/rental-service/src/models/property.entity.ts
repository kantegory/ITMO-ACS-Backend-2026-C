import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { City } from './city.entity';
import { Comfort } from './comfort.entity';
import { PropertyPhoto } from './property-photo.entity';
import { RentDeal } from './rent-deal.entity';
import { Review } from './review.entity';
import { Conversation } from './conversation.entity';

export enum PropertyType {
    FLAT = 'flat',
    ROOM = 'room',
    HOUSE = 'house',
}

@Entity()
export class Property extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({ type: 'varchar', length: 20, nullable: false })
    type: PropertyType;

    @Column({ type: 'real', nullable: false })
    pricePerDay: number;

    @Column({ type: 'varchar', length: 500, nullable: false })
    address: string;

    @Column({ type: 'integer', nullable: true })
    roomsCount: number;

    @Column({ type: 'real', nullable: true })
    area: number;

    @Column({ type: 'integer', nullable: true })
    maxGuests: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.properties, { nullable: false })
    owner: User;

    @Column({ type: 'integer' })
    ownerId: number;

    @ManyToOne(() => City, (city) => city.properties, { nullable: false })
    city: City;

    @Column({ type: 'integer' })
    cityId: number;

    @ManyToMany(() => Comfort)
    @JoinTable({ name: 'property_comforts' })
    comforts: Comfort[];

    @OneToMany(() => PropertyPhoto, (photo) => photo.property)
    photos: PropertyPhoto[];

    @OneToMany(() => RentDeal, (deal) => deal.property)
    rentDeals: RentDeal[];

    @OneToMany(() => Review, (review) => review.property)
    reviews: Review[];

    @OneToMany(() => Conversation, (conv) => conv.property)
    conversations: Conversation[];
}
