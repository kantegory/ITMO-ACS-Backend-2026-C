import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @Column()
  recipeId: number;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
