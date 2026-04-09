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
import { Chat } from './chat.entity';

export enum MessageStatus {
    SENT = 'sent',
    RECEIVED = 'received',
    READ = 'read',
}

@Entity('messages')
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

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

    @Column({
        name: 'sent_by',
        type: 'bigint',
    })
    sentBy: string;

    @Column({
        name: 'status',
        type: 'enum',
        enum: MessageStatus,
    })
    status: MessageStatus;

    @Column({
        name: 'edited',
        type: 'bool',
        default: false,
    })
    edited: boolean;

    @Column({
        name: 'chat_id',
        type: 'bigint',
    })
    chatId: string;

    @ManyToOne(() => User, (user) => user.messages, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'sent_by' })
    sender: User;

    @ManyToOne(() => Chat, (chat) => chat.messages, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'chat_id' })
    chat: Chat;
}
