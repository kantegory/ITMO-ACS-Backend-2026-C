import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Unique,
} from 'typeorm';

import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

// Связующая таблица "кто администрирует какой ресторан" — один пользователь
// с ролью RESTAURANT_ADMIN может администрировать несколько ресторанов,
// и у одного ресторана может быть несколько администраторов.
@Entity()
@Unique(['user_id', 'restaurant_id']) // нельзя назначить одного и того же человека дважды на один ресторан
export class RestaurantAdmin {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) user_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false }) // CASCADE — если удалить пользователя, эта запись удалится сама
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false }) // так же и при удалении ресторана
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
