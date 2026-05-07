import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

import { OneToMany } from 'typeorm';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  authorId: number;

  @Column('text')
  description: string;

  @Column()
  img_url: string;

  @Column()
  cook_time: string;

  @Column()
  difficulty_id: number;

  @Column()
  type_id: number;

  @Column({ default: 0 })
  rating: number;

  @CreateDateColumn()
  created_at: Date;
}