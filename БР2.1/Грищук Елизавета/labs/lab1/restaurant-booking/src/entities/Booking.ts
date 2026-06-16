import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Table } from './Table';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'table_id' })
  tableId: number;

  @Column({ name: 'booking_time', type: 'timestamp' })
  bookingTime: Date;

  @Column({ name: 'guests_count' })
  guestsCount: number;

  @Column({ default: 'pending', length: 20 })
  status: BookingStatus;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Table, (table) => table.bookings)
  @JoinColumn({ name: 'table_id' })
  table: Table;
}
