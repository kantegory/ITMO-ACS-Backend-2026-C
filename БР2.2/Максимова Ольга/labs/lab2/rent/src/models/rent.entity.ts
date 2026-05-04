import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RentStatus {
  ONGOING = 'ongoing',
  CLOSED = 'closed',
  PENDING =  'pending',
  PENDING_PAYMENT = 'pending_payment',
}

@Entity('rents')
export class Rent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  accommodation_id!: string;

  @Column({ type: 'uuid', nullable: true })
  landlord_id!: string | null;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount!: number;

  @Column({ type: 'date' })
  start_date!: Date;

  @Column({ type: 'date' })
  end_date!: Date;

  @Column({ type: 'enum', enum: RentStatus, default: RentStatus.CLOSED })
  status!: RentStatus;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}