import {
    Entity,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('chat')
export class Chat extends BaseEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @Column({
        name: 'user_1_id',
        type: 'bigint',
    })
    user1Id: string;

    @Column({
        name: 'user_2_id',
        type: 'bigint',
    })
    user2Id: string;

    @ManyToOne(() => User, (user) => user.chatsAsUser1, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_1_id' })
    user1: User;

    @ManyToOne(() => User, (user) => user.chatsAsUser2, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_2_id' })
    user2: User;

    @OneToMany(() => Message, (message) => message.chat)
    messages: Message[];
}
