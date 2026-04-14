import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  description: string;

  @Column()
  userId: number;

  @Column()
  recipeId: number;

  @CreateDateColumn()
  createdAt: Date;
}