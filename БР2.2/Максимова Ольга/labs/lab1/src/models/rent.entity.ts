import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Accommodation } from './accommodation.entity';
import { Payment } from './payment.entity';

export enum RentStatus {
    ONGOING = 'ongoing',
    CLOSED = 'closed'
}

@Entity()
export class Rent extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'int' })
    tenant_id: number;

    @Column({ type: 'int' })
    landlord_id: number;

    @Column({ type: 'int' })
    accom_id: number;

    @Column({ type: 'date' })
    start_date: Date;

    @Column({ type: 'date' })
    end_date: Date;

    @Column({ type: 'enum', enum: RentStatus, default: RentStatus.ONGOING })
    rent_status: RentStatus;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @ManyToOne(() => User, user => user.rents_as_tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: User;

    @ManyToOne(() => User, user => user.rents_as_landlord)
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    @ManyToOne(() => Accommodation, accommodation => accommodation.rents)
    @JoinColumn({ name: 'accom_id' })
    accommodation: Accommodation;

    @OneToMany(() => Payment, payment => payment.rent)
    payments: Payment[];
}