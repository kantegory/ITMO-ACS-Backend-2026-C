import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Accommodation } from './accommodation.entity';
import { Facility } from './facility.entity';

@Entity('accommodation_facilities')
export class AccommodationFacility {
    @PrimaryColumn({ type: 'int' })
    accommodation_id: number;

    @PrimaryColumn({ type: 'int' })
    facility_id: number;

    @ManyToOne(() => Accommodation)
    @JoinColumn({ name: 'accommodation_id' })
    accommodation: Accommodation;

    @ManyToOne(() => Facility)
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;
}
