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
import { Chat } from './chat.entity';
import { MessageStatus } from './enums';

@Entity('messages')
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'text', nullable: false })
    text: string;

    @Column({ type: 'bigint', name: 'sent_by', nullable: false })
    sentBy: number;

    @Column({
        type: 'enum',
        enum: MessageStatus,
        default: MessageStatus.SENT,
        nullable: false,
    })
    status: MessageStatus;

    @Column({ type: 'bool', default: false, nullable: false })
    edited: boolean;

    @Column({ type: 'bigint', name: 'chat_id', nullable: false })
    chatId: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'sent_by' })
    sender: User;

    @ManyToOne(() => Chat, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chat_id' })
    chat: Chat;
}
