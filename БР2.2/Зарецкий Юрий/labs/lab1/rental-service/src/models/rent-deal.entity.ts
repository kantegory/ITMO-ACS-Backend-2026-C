import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Property } from './property.entity';
import { User } from './user.entity';

export enum DealStatus {
    REQUESTED = 'requested',
    APPROVED = 'approved',
    CANCELLED = 'cancelled',
}

@Entity()
export class RentDeal extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 10, nullable: false })
    startDate: string;

    @Column({ type: 'varchar', length: 10, nullable: false })
    endDate: string;

    @Column({ type: 'varchar', length: 20, default: DealStatus.REQUESTED })
    status: DealStatus;

    @Column({ type: 'real', nullable: false })
    totalPrice: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ type: 'text', nullable: true })
    cancellationReason: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Property, (property) => property.rentDeals, {
        nullable: false,
    })
    property: Property;

    @Column({ type: 'integer' })
    propertyId: number;

    @ManyToOne(() => User, (user) => user.rentalsAsTenant, { nullable: false })
    tenant: User;

    @Column({ type: 'integer' })
    tenantId: number;

    @ManyToOne(() => User, (user) => user.rentalsAsOwner, { nullable: false })
    owner: User;

    @Column({ type: 'integer' })
    ownerId: number;
}
