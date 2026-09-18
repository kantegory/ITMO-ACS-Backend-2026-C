import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// recipeId и userId — обычные числа, без @ManyToOne: Recipe живёт в recipe_db,
// User — в auth_db, связь между базами данных технически невозможна.
// Существование recipeId проверяется вызовом Recipe Service перед созданием комментария.
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  text!: string;

  @Column()
  recipeId!: number;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
