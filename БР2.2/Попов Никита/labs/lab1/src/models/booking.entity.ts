import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

export enum BookingStatus {
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
}

@Entity()
export class Booking extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column({ type: 'uuid' })
    restaurantId: string;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.bookings, {
        onDelete: 'CASCADE',
    })
    restaurant: Restaurant;

    @Column({ type: 'timestamptz' })
    fromDate: Date;

    @Column({ type: 'timestamptz' })
    toDate: Date;

    @Column({ type: 'int' })
    guestCount: number;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.CONFIRMED,
    })
    status: BookingStatus;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @CreateDateColumn()
    createdAt: Date;
}

