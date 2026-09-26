import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

// Копия лр1/src/models/restaurant-photo.entity.ts.
@Entity()
@Index(['restaurant_id'], { unique: true, where: '"is_main" = true' })
export class RestaurantPhoto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'varchar', length: 500, nullable: false })
    url: string;

    @Column({ type: 'boolean', default: false })
    is_main: boolean;

    @Column({ type: 'int', default: 0 })
    sort_order: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
