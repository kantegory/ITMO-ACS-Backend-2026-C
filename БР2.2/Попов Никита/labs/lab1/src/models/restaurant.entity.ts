import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';

import { MenuItem } from './menu-item.entity';
import { Booking } from './booking.entity';
import { Review } from './review.entity';

export enum PriceLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    MEDIUM_HIGH = 'MEDIUM_HIGH',
    HIGH = 'HIGH',
}

@Entity()
export class Restaurant extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 300 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 300 })
    address: string;

    @Column({ type: 'varchar', length: 150 })
    city: string;

    @Column({
        type: 'enum',
        enum: PriceLevel,
    })
    priceLevel: PriceLevel;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ type: 'float', nullable: true })
    rating?: number;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => MenuItem, (item) => item.restaurant)
    menuItems: MenuItem[];

    @OneToMany(() => Booking, (booking) => booking.restaurant)
    bookings: Booking[];

    @OneToMany(() => Review, (review) => review.restaurant)
    reviews: Review[];
}

