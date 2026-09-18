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
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { Ingredient } from './ingredient.entity';
import { Step } from './step.entity';

export type Difficulty = 'easy' | 'medium' | 'hard';
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

  @Column()
  cookingTime!: number;

  @Column({ type: 'varchar', nullable: true })
  image?: string | null;

  @Column({ type: 'varchar', default: 'draft' })
  status!: RecipeStatus;

  // Раньше здесь была @ManyToOne(() => User) — но User теперь в auth_db,
  // связь между базами данных невозможна. Просто число, а сами данные
  // автора (username, avatar) при необходимости запрашиваются у Auth Service
  // через src/clients/authClient.ts и добавляются "на лету" перед ответом.
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Не хранится в БД — заполняется в сериализаторе данными,
  // полученными от Auth Service (author) и Social Service (likesCount)
  author?: { id: number; username: string; firstName?: string; lastName?: string; avatar?: string; role?: string };
  likesCount?: number;
}
