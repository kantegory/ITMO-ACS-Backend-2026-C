import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Check,
} from 'typeorm';

import { User } from './user.entity';
import { RestaurantTable } from './restaurant-table.entity';
import { TimeSlot } from './time-slot.entity';
import { BookingStatus } from './enums/booking-status.enum';

// Бронь столика: кто, на какой столик, на какой слот и дату, сколько гостей.
@Entity()
@Check(`"guests_count" > 0`)
// Самое важное ограничение во всей базе: один и тот же столик на один и тот же
// слот и дату нельзя забронировать дважды, ПОКА бронь активна (PENDING или CONFIRMED).
// "where" делает индекс частичным — он не мешает создать новую бронь на то же
// время после того, как старую отменили (CANCELLED) или она завершилась (COMPLETED).
// Это последняя линия защиты от двойной брони на случай, если два запроса
// придут одновременно и код-проверка в booking.service.ts не успеет сработать первой.
@Index(['restaurant_table_id', 'time_slot_id', 'booking_date'], {
    unique: true,
    where: `"status" IN ('PENDING', 'CONFIRMED')`,
})
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) user_id: number;

    // RESTRICT везде ниже — историю бронирований нельзя стереть случайным
    // удалением пользователя/столика/слота, сначала нужно разобраться с бронями
    @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'int' }) restaurant_table_id: number;

    @ManyToOne(() => RestaurantTable, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'restaurant_table_id' })
    restaurant_table: RestaurantTable;

    @Column({ type: 'int' }) time_slot_id: number;

    @ManyToOne(() => TimeSlot, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'time_slot_id' })
    time_slot: TimeSlot;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING, // новая бронь всегда начинается со статуса "ожидает подтверждения"
    })
    status: BookingStatus;

    @Column({ type: 'date', nullable: false })
    booking_date: string; // на какую дату бронь (не путать со start_time/end_time слота — это шаблон времени)

    @Column({ type: 'int', nullable: false })
    guests_count: number;

    @Column({ type: 'text', nullable: true })
    comment: string | null; // пожелания гостя, например "столик у окна"

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
