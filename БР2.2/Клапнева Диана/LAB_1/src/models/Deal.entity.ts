import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable
} from 'typeorm';
import { User } from './User.entity';
import { Estate } from './Estate.entity';

export enum DealStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    CLOSED = 'closed'
}

@Entity('deals')
export class Deal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'landlord_id' })
    landlord_id: number;

    @Column({ name: 'tenant_id' })
    tenant_id: number;

    @Column()
    period: string;

    @Column({ name: 'deal_status', type: 'enum', enum: DealStatus, default: DealStatus.PENDING })
    deal_status: DealStatus;

    @Column({ name: 'is_published', default: false })
    is_published: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updated_at?: Date;

    @ManyToOne(() => User, user => user.deals_as_landlord)
    landlord: User;

    @ManyToOne(() => User, user => user.deals_as_tenant)
    tenant: User;

    @ManyToMany(() => Estate, estate => estate.deals)
    @JoinTable({
        name: 'deal_estates',
        joinColumn: { name: 'estate_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'deal_id', referencedColumnName: 'id' }
    })
    estates: Estate[];
}
