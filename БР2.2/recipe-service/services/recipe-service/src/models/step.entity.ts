import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('steps')
export class Step {
  @PrimaryGeneratedColumn()
  id!: number;

  // В API поле называется "order", но "order" — зарезервированное слово в SQL,
  // поэтому в самой БД столбец называется step_number (как и решили в ДЗ1)
  @Column({ name: 'step_number' })
  order!: number;

  @Column({ type: 'text' })
  description!: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe!: Recipe;

  @Column()
  recipeId!: number;
}
