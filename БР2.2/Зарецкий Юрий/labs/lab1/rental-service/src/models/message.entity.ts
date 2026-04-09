import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: false })
    text: string;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Conversation, (conv) => conv.messages, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    conversation: Conversation;

    @Column({ type: 'integer' })
    conversationId: number;

    @ManyToOne(() => User, (user) => user.messages, { nullable: false })
    sender: User;

    @Column({ type: 'integer' })
    senderId: number;
}
