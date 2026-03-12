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

@Entity('chat')
export class Chat extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'bigint', name: 'user_1_id', nullable: false })
    user1Id: number;

    @Column({ type: 'bigint', name: 'user_2_id', nullable: false })
    user2Id: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_1_id' })
    user1: User;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_2_id' })
    user2: User;
}
