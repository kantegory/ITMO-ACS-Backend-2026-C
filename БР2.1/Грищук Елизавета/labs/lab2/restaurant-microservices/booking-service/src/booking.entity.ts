import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'int' })
    tableId: number;

    @Column({ type: 'timestamp' })
    bookingTime: Date;

    @Column({ type: 'int' })
    guestsCount: number;

    @Column({ type: 'varchar', default: 'pending' })
    status: string;
}