import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    Check,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

// Адаптация лр1/src/models/review.entity.ts: раздел 9 CLAUDE.md убирает
// межсервисный FK на User — user_id остаётся обычным полем без связи и onDelete.
@Entity()
@Unique(['user_id', 'restaurant_id'])
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'int' }) user_id: number;

    @Column({ type: 'int', nullable: false })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
