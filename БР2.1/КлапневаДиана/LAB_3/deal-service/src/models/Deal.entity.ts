import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DealEstate } from './DealEstate.entity';

@Entity('deals')
export class Deal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'landlord_id' })
    landlordId: number;

    @Column({ name: 'tenant_id' })
    tenantId: number;

    @Column({ type: 'integer' })
    period: number;

    @Column({ name: 'deal_status', length: 50, default: 'pending' })
    dealStatus: string;

    @Column({ name: 'is_published', default: false })
    isPublished: boolean;

    @OneToMany(() => DealEstate, (dealEstate) => dealEstate.deal)
    dealEstates: DealEstate[];

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
