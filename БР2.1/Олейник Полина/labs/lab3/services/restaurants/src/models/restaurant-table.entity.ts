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

// Копия лр1/src/models/restaurant-table.entity.ts.
@Entity()
@Unique(['restaurant_id', 'number'])
@Check(`"capacity" > 0`)
export class RestaurantTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'varchar', length: 50, nullable: false })
    number: string;

    @Column({ type: 'int', nullable: false })
    capacity: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    zone: string | null;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;
}
