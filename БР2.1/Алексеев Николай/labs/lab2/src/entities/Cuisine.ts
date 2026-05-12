import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Recipe } from './Recipe';

@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Recipe, recipe => recipe.cuisine)
  recipes: Recipe[];
}