import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('saved_recipes')
@Unique(['userId', 'recipeId'])
export class SavedRecipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'recipe_id' })
  recipeId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}