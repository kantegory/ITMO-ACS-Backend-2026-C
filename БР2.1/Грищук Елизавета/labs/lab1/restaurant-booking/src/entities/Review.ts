import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Restaurant } from './Restaurant';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'restaurant_id' })
  restaurantId: number;

  @Column()
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;
}
