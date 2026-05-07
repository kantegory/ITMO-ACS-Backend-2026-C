import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('reviews')
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({
        name: 'author_id',
        type: 'bigint',
    })
    authorId: string;

    @Column({
        name: 'target_id',
        type: 'bigint',
    })
    targetId: string;

    @Column({
        name: 'rating',
        type: 'numeric',
        precision: 4,
        scale: 2,
    })
    rating: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @Column({
        name: 'text',
        type: 'text',
    })
    text: string;

    @ManyToOne(() => User, (user) => user.writtenReviews, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @ManyToOne(() => User, (user) => user.receivedReviews, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'target_id' })
    target: User;
}
