import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { Ingredient } from './ingredient.entity';
import { Step } from './step.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { Favorite } from './favorite.entity';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Жизненный цикл рецепта:
// draft (черновик) -> pending (на модерации) -> published (опубликован) | rejected (отклонён)
// из rejected можно снова отправить на модерацию (submit) -> pending
export type RecipeStatus = 'draft' | 'pending' | 'published' | 'rejected';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  shortDescription!: string;

  @Column({ type: 'text' })
  fullDescription!: string;

  @Column({ type: 'varchar' })
  difficulty!: Difficulty;

  // время приготовления в минутах
  @Column()
  cookingTime!: number;

  @Column({ type: 'varchar', nullable: true })
  image?: string | null;

  @Column({ type: 'varchar', default: 'draft' })
  status!: RecipeStatus;

  @ManyToOne(() => User, (user) => user.recipes, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column()
  authorId!: number;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column()
  categoryId!: number;

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable({
    name: 'recipe_tags',
    joinColumn: { name: 'recipeId' },
    inverseJoinColumn: { name: 'tagId' },
  })
  tags!: Tag[];

  // cascade — чтобы можно было сохранять ingredients/steps вместе с рецептом одним save()
  // orphanedRowAction: 'delete' — чтобы при обновлении рецепта старые строки, которых
  // больше нет в новом массиве, автоматически удалялись
  @OneToMany(() => Ingredient, (ingredient) => ingredient.recipe, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  ingredients!: Ingredient[];

  @OneToMany(() => Step, (step) => step.recipe, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  steps!: Step[];

  @OneToMany(() => Comment, (comment) => comment.recipe)
  comments!: Comment[];

  @OneToMany(() => Like, (like) => like.recipe)
  likes!: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.recipe)
  favorites!: Favorite[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Не хранится в БД: количество лайков считается отдельным запросом
  // и записывается в это поле "на лету" перед отправкой ответа
  likesCount?: number;
}
