import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from './chat.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    sender!: string;

    @Column({ type: 'text' })
    content!: string;

    @ManyToOne(() => Chat, chat => chat.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chatId' })
    chat!: Chat;
}