import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Address } from './address.entity';
import { RentTerms } from './rentTerms.entity';
import { Facility } from './facility.entity';
import { AccomPhoto } from './accomPhoto.entity';
import { Availability } from './availability.entity';

@Entity('accommodations')
export class Accommodation extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    landlord_id!: string;

    @Column({ type: 'varchar', length: 100 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;   

    @ManyToOne(() => Address, address => address.accommodations)
    @JoinColumn({ name: 'address_id' })
    address!: Address;

    @Column({ type: 'uuid' })
    address_id!: string;

    // @Column({ type: 'jsonb', nullable: true })
    // location_data?: Record<string, any>;

    @Column({ type: 'varchar', length: 50 })
    accom_type!: string;

    @Column({ type: 'int' })
    rooms_num!: number;

    @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
    living_space?: number | null;

    @Column({ type: 'boolean', default: false })
    is_decorated!: boolean;

    // @Column({ type: 'boolean', default: false })
    // is_rented!: boolean;

    // @Column({ type: 'boolean', default: false })
    // is_published!: boolean;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @OneToOne(() => RentTerms, rentTerms => rentTerms.accommodation, { nullable: true })
    rent_terms?: RentTerms;

    @OneToMany(() => AccomPhoto, photo => photo.accommodation)
    photos!: AccomPhoto[];

    @ManyToMany(() => Facility, facility => facility.accommodations)
    @JoinTable({
        name: 'accommodation_facilities',
        joinColumn: { name: 'accom_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'facility_id', referencedColumnName: 'id' },
    })
    facilities!: Facility[];

    @OneToMany(() => Availability, availability => availability.accommodation)
    availability?: Availability[];
    
}