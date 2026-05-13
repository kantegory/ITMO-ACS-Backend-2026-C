import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Step } from './Step';
import { Ingredient } from './Ingredient';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'author_id' })
  authorId: number;

  @Column({ name: 'type_id' })
  typeId: number;

  @Column({ name: 'cuisine_id' })
  cuisineId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ name: 'video_url', nullable: true, length: 500 })
  videoUrl: string;

  @Column({ name: 'cook_time' })
  cookTime: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'people_amount', type: 'smallint', default: 2 })
  peopleAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Step, (step) => step.recipe, { cascade: true })
  steps: Step[];

  @OneToMany(() => Ingredient, (ingredient) => ingredient.recipe, { cascade: true })
  ingredients: Ingredient[];
}