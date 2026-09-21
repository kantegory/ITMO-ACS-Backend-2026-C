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
import { User } from './user.entity';

// Отзыв пользователя о ресторане. Из отзывов пересчитывается Restaurant.rating
// (см. services/review.service.ts).
@Entity()
@Unique(['user_id', 'restaurant_id']) // один пользователь — максимум один отзыв на ресторан
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    // RESTRICT — нельзя удалить ресторан, пока у него есть отзывы
    // (вместо удаления ресторана нужно проставить is_active = false)
    @ManyToOne(() => Restaurant, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'int' }) user_id: number;

    @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false }) // нельзя удалить пользователя, у которого есть отзывы — история отзывов сохраняется
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'int', nullable: false })
    rating: number; // оценка от 1 до 5

    @Column({ type: 'text', nullable: true })
    comment: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
