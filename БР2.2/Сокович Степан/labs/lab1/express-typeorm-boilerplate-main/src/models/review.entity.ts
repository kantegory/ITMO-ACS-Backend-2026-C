import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('reviews')
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'bigint', name: 'author_id', nullable: false })
    authorId: number;

    @Column({ type: 'bigint', name: 'target_id', nullable: false })
    targetId: number;

    @Column({ type: 'numeric', precision: 4, scale: 2, nullable: false })
    rating: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'text', nullable: true })
    text: string | null;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'target_id' })
    target: User;
}
