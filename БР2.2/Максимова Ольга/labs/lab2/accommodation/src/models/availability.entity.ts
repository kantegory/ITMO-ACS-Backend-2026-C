import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accommodation } from './accommodation.entity';

@Entity('availability')
export class Availability extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  rent_id!: string;

  @ManyToOne(() => Accommodation, accommodation => accommodation.availability, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accom_id' })
  accommodation!: Accommodation;

  @Column({ type: 'timestamp' })
  start_date!: Date;

  @Column({ type: 'timestamp' })
  end_date!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}