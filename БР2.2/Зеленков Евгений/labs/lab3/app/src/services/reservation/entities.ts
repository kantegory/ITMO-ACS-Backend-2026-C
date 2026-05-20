import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ReservationStatus } from '../../shared/enums';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId!: string;

  @Column({ name: 'table_id', type: 'uuid' })
  tableId!: string;

  @Column({ name: 'reserved_at', type: 'timestamp' })
  reservedAt!: Date;

  @Column({ name: 'reserved_until', type: 'timestamp' })
  reservedUntil!: Date;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.Pending })
  status!: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'guest_count' })
  guestCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export const reservationEntities = [Reservation];
