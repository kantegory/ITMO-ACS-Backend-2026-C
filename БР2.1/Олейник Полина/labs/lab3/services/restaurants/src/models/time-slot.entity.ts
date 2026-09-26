import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

// Копия лр1/src/models/time-slot.entity.ts.
@Entity()
@Unique(['restaurant_id', 'start_time'])
@Check(`"start_time" < "end_time"`)
export class TimeSlot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'time', nullable: false })
    start_time: string;

    @Column({ type: 'time', nullable: false })
    end_time: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;
}
