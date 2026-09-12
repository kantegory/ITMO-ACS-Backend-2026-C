import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Recipe } from './recipe.entity';

@Entity('favorites')
export class Favorite {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  recipeId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  // eager: true — в /users/me/favorites сразу нужен весь рецепт целиком
  @ManyToOne(() => Recipe, (recipe) => recipe.favorites, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'recipeId' })
  recipe!: Recipe;

  @CreateDateColumn()
  createdAt!: Date;
}
