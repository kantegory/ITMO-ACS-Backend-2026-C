import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Accommodation } from './accommodation.entity';

@Entity('accomPhoto')
export class AccomPhoto extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string; 

  @Column({ type: 'uuid' })
  accom_id!: string; 

  @Column({ type: 'varchar', length: 500 })
  photo_url!: string;

  @Column({ type: 'int', nullable: true })
  sort_order!: number;

  @Column({ type: 'boolean', default: false })
  is_main!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @ManyToOne(() => Accommodation, (accommodation) => accommodation.photos)
  @JoinColumn({ name: 'accom_id' })
  accommodation!: Accommodation;
}