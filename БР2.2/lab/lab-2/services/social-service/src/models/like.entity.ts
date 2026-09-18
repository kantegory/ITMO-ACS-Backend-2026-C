import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

// Составной первичный ключ (userId + recipeId) сам по себе гарантирует
// "1 пользователь - 1 лайк на рецепт" на уровне БД (то же самое, что было в монолите)
@Entity('likes')
export class Like {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  recipeId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
