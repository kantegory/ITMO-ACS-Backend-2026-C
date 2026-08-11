import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Deal } from './Deal.entity';

@Entity('deal_estates')
export class DealEstate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'deal_id' })
    dealId: number;

    @Column({ name: 'estate_id' })
    estateId: number;

    @ManyToOne(() => Deal, (deal) => deal.dealEstates)
    @JoinColumn({ name: 'deal_id' })
    deal: Deal;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}
