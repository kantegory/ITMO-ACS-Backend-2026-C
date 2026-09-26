import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Unique,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

// Адаптация лр1/src/models/restaurant-admin.entity.ts: раздел 9 CLAUDE.md убирает
// межсервисный FK на User — user_id остаётся обычным полем без связи и onDelete.
@Entity()
@Unique(['user_id', 'restaurant_id'])
export class RestaurantAdmin {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) user_id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
