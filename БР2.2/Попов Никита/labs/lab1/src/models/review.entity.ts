import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column({ type: 'uuid' })
    restaurantId: string;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews, {
        onDelete: 'CASCADE',
    })
    restaurant: Restaurant;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @CreateDateColumn()
    createdAt: Date;
}

