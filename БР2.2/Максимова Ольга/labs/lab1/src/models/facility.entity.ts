import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToMany } from 'typeorm';
import { Accommodation } from './accommodation.entity';

@Entity()
export class Facility extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @ManyToMany(() => Accommodation, accommodation => accommodation.facilities)
    accommodations: Accommodation[];
}