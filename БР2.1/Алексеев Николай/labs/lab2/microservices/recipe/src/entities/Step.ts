import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Recipe } from './Recipe';

@Entity('steps')
@Unique(['recipeId', 'stepNumber'])
export class Step {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recipe_id' })
  recipeId: number;

  @Column({ name: 'image_url', nullable: true, length: 500 })
  imageUrl: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ name: 'step_number', type: 'smallint' })
  stepNumber: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}