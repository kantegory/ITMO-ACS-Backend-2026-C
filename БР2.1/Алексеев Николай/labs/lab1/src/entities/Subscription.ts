import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique, Column } from 'typeorm';
import { User } from './User';

@Entity('subscriptions')
@Unique(['followerId', 'authorId'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'follower_id' })
  followerId: number;

  @Column({ name: 'author_id' })
  authorId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, user => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @ManyToOne(() => User, user => user.subscribers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;
}