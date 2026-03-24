import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Recipe } from './Recipe';

export enum Unit {
  GRAM = 'GRAM',
  ML = 'ML',
  PIECE = 'PIECE',
  TBSPOON = 'TBSPOON',
  TEASPOON = 'TEASPOON',
  THING = 'THING'
}

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recipe_id' })
  recipeId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'smallint' })
  amount: number;

  @Column({ type: 'enum', enum: Unit })
  unit: Unit;

  @ManyToOne(() => Recipe, recipe => recipe.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}