import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Ingredient } from './ingredient.entity';

@Entity()
export class RecipeIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
  recipe: Recipe;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
  ingredient: Ingredient;

  @Column()
  amount: string;

  @Column()
  unit: string;
}