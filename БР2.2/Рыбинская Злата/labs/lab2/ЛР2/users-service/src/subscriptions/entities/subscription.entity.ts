import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
@Unique(['subscriber', 'target'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  subscriber: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  target: User;
}