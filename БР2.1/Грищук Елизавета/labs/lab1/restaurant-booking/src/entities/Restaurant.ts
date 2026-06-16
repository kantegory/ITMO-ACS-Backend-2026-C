import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Category } from './Category';
import { Table } from './Table';
import { Review } from './Review';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 250 })
  address: string;

  @Column({ name: 'price_range' })
  priceRange: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @ManyToOne(() => Category, (category) => category.restaurants)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Table, (table) => table.restaurant)
  tables: Table[];

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews: Review[];
}
