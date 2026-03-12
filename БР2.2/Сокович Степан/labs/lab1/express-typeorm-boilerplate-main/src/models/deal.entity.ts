import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Property } from './property.entity';
import { DealStatus } from './enums';

@Entity('deals')
export class Deal extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'bigint', name: 'landlord_id', nullable: false })
    landlordId: number;

    @Column({ type: 'bigint', name: 'tenant_id', nullable: false })
    tenantId: number;

    @Column({ type: 'timestamptz', name: 'start_time', nullable: false })
    startTime: Date;

    @Column({ type: 'timestamptz', name: 'end_time', nullable: false })
    endTime: Date;

    @Column({ type: 'bigint', name: 'estate_id', nullable: false })
    estateId: number;

    @Column({
        type: 'enum',
        enum: DealStatus,
        default: DealStatus.REQUESTED,
        nullable: false,
    })
    status: DealStatus;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'tenant_id' })
    tenant: User;

    @ManyToOne(() => Property, { nullable: false })
    @JoinColumn({ name: 'estate_id' })
    property: Property;
}
