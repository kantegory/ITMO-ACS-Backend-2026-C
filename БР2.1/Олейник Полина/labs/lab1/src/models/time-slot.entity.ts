import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

// Временной интервал, на который можно бронировать столик (например 12:00–14:00).
// Это шаблон — он один и тот же для всех дат, конкретная дата брони хранится
// уже в самой брони (Booking.booking_date), а не здесь.
@Entity()
@Unique(['restaurant_id', 'start_time']) // у одного ресторана не может быть двух слотов с одинаковым началом
@Check(`"start_time" < "end_time"`) // конец слота обязан быть позже начала
export class TimeSlot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'time', nullable: false })
    start_time: string;

    @Column({ type: 'time', nullable: false })
    end_time: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;
}
