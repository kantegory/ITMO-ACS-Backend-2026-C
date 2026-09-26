import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Check,
} from 'typeorm';

import { BookingStatus } from './enums/booking-status.enum';

// Адаптация лр1/src/models/booking.entity.ts: раздел 9 CLAUDE.md убирает
// межсервисные FK на User/RestaurantTable/TimeSlot — все три id остаются обычными
// полями без связи. Добавлено restaurant_id (копия при создании) — нужен для
// фильтра броней ресторана и проверки прав без обращения к restaurants (раздел 9).
@Entity()
@Check(`"guests_count" > 0`)
@Index(['restaurant_table_id', 'time_slot_id', 'booking_date'], {
    unique: true,
    where: `"status" IN ('PENDING', 'CONFIRMED')`,
})
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) user_id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @Column({ type: 'int' }) restaurant_table_id: number;

    @Column({ type: 'int' }) time_slot_id: number;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING,
    })
    status: BookingStatus;

    @Column({ type: 'date', nullable: false })
    booking_date: string;

    @Column({ type: 'int', nullable: false })
    guests_count: number;

    @Column({ type: 'text', nullable: true })
    comment: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
