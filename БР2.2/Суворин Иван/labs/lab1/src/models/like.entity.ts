import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Recipe } from './recipe.entity';

// Составной первичный ключ (userId + recipeId) сам по себе гарантирует
// требование "1 пользователь - 1 лайк на рецепт" на уровне БД
@Entity('likes')
export class Like {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  recipeId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Recipe, (recipe) => recipe.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe!: Recipe;

  @CreateDateColumn()
  createdAt!: Date;
}
