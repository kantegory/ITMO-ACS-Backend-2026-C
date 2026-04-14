import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  CreateDateColumn,
  Column,
} from 'typeorm';


@Entity()
@Unique(['user', 'recipe'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user: number;

  @Column()
  recipe: number;

  @CreateDateColumn()
  createdAt: Date;
}