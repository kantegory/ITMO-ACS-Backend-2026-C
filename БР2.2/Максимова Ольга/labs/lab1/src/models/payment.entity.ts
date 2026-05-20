import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Rent } from './rent.entity';

export enum PaymentStatus {
    SUCCESSFUL = 'successful',
    PENDING = 'pending',
    FAILED = 'failed'
}

@Entity()
export class Payment extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'int' })
    rent_id: number;

    @Column({ type: 'float' })
    amount: number;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date;

    @ManyToOne(() => Rent, rent => rent.payments)
    @JoinColumn({ name: 'rent_id' })
    rent: Rent;
}