import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany } from 'typeorm';
import { Accommodation } from './accommodation.entity';

@Entity()
export class Address extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'varchar', length: 100 })
    city: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    district: string;

    @Column({ type: 'varchar', length: 200 })
    street: string;

    @Column({ type: 'varchar', length: 20 })
    house_num: string;

    @Column({ type: 'int', nullable: true })
    building: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @OneToMany(() => Accommodation, accommodation => accommodation.address)
    accommodations: Accommodation[];
}