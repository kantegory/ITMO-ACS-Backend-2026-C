import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Restaurant } from './Restaurant';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.category)
  restaurants: Restaurant[];
}
