import { 
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, 
    OneToMany, ManyToMany, JoinTable, OneToOne, JoinColumn 
} from 'typeorm';
import { User } from './user.entity';
import { Address } from './address.entity';
import { Facility } from './facility.entity';
import { AccomPhoto } from './accomPhoto.entity';
import { RentTerms } from './rentTerms.entity';
import { Rent } from './rent.entity';
import { Message } from './message.entity';

export enum AccomType {
    FLAT = 'flat',
    HOUSE = 'house',
    ROOM = 'room',
    TOWNHOUSE = 'townhouse',
    DACHA = 'dacha'
}

@Entity()
export class Accommodation extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'int' })
    landlord_id: number;

    @Column({ type: 'int' })
    address_id: number;

    @Column({ type: 'enum', enum: AccomType })
    accom_type: AccomType;

    @Column({ type: 'varchar', length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'int' })
    rooms_num: number;

    @Column({ type: 'float', nullable: true })
    living_space: number;

    @Column({ type: 'boolean', default: false })
    is_decorated: boolean;

    @Column({ type: 'boolean', default: false })
    is_rented: boolean;

    @Column({ type: 'boolean', default: true })
    is_published: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @ManyToOne(() => User, user => user.accommodations)
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    @ManyToOne(() => Address, address => address.accommodations)
    @JoinColumn({ name: 'address_id' })
    address: Address;

    @OneToMany(() => AccomPhoto, photo => photo.accommodation)
    photos: AccomPhoto[];

    @ManyToMany(() => Facility, facility => facility.accommodations)
    @JoinTable({
        name: 'accommodation_facilities',
        joinColumn: { name: 'accommodation_id' },
        inverseJoinColumn: { name: 'facility_id' }
    })
    facilities: Facility[];

    @OneToOne(() => RentTerms, rentTerms => rentTerms.accommodation)
    @JoinColumn({ name: 'rent_terms_id' }) 
    rent_terms: RentTerms;

    @OneToMany(() => Rent, rent => rent.accommodation)
    rents: Rent[];

    @OneToMany(() => Message, message => message.accommodation)
    messages: Message[];
}