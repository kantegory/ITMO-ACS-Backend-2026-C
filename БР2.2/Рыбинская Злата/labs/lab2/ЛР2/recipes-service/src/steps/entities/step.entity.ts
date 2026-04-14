import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Recipe } from '../../recipes/entities/recipe.entity';

@Entity()
export class Step {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  order: number;

  @Column({ nullable: true })
  image_url: string;

  @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
  recipe: Recipe;
}