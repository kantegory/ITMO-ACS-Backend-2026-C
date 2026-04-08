import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  restaurant_id!: number;

  @Column()
  rating!: number;

  @Column({ type: 'text' })
  comment!: string;

  @CreateDateColumn()
  created_at!: Date;
}
