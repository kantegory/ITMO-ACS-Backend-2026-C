import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToOne, JoinColumn } from 'typeorm';
import { Accommodation } from './accommodation.entity';

@Entity()
export class RentTerms extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'int' })
    accom_id: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    util_serv_pay: string;

    @Column({ type: 'float' })
    price: number;

    @Column({ type: 'float', nullable: true })
    deposit: number;

    @Column({ type: 'float', nullable: true })
    commission: number;

    @Column({ type: 'boolean' })
    with_kids: boolean;

    @Column({ type: 'boolean' })
    with_pets: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @OneToOne(() => Accommodation, accommodation => accommodation.rent_terms)
    @JoinColumn({ name: 'accom_id' })
    accommodation: Accommodation;
}