import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { EstateForRent } from './estate-for-rent.entity';

export enum DealStatus {
    REQUESTED = 'requested',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
}

@Entity('deals')
export class Deal extends BaseEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @Column({
        name: 'landlord_id',
        type: 'bigint',
    })
    landlordId: string;

    @Column({
        name: 'tenant_id',
        type: 'bigint',
    })
    tenantId: string;

    @Column({
        name: 'start_time',
        type: 'timestamptz',
    })
    startTime: Date;

    @Column({
        name: 'end_time',
        type: 'timestamptz',
    })
    endTime: Date;

    @Column({
        name: 'estate_id',
        type: 'bigint',
    })
    estateId: string;

    @Column({
        name: 'status',
        type: 'enum',
        enum: DealStatus,
    })
    status: DealStatus;

    @ManyToOne(() => User, (user) => user.landlordDeals, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    @ManyToOne(() => User, (user) => user.tenantDeals, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'tenant_id' })
    tenant: User;

    @ManyToOne(() => EstateForRent, (estate) => estate.deals, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'estate_id' })
    estate: EstateForRent;
}
