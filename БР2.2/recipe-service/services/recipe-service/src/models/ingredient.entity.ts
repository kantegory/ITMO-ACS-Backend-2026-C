import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Recipe } from './recipe.entity';

// Ингредиент "живёт" внутри конкретного рецепта (не общий справочник),
// поэтому у него нет отдельной страницы редактирования — только через рецепт.
@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  quantity!: string;

  @Column({ type: 'varchar', nullable: true })
  unit?: string | null;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe!: Recipe;

  @Column()
  recipeId!: number;
}
