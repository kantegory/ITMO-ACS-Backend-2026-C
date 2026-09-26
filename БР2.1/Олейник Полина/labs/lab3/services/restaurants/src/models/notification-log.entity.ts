import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

// Новая таблица (ДЗ5) — restaurants сохраняет сюда каждое полученное из
// RabbitMQ событие брони. Отдельная сущность, а не связь с Booking:
// booking живёт в bookings_db, здесь только то, что пришло в сообщении.
@Entity()
export class NotificationLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    event: string;

    @Column({ type: 'int' }) booking_id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @Column({ type: 'jsonb' })
    payload: Record<string, unknown>;

    @CreateDateColumn({ type: 'timestamptz' })
    received_at: Date;
}
