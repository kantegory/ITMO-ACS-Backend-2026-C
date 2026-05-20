import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class MessageAttach extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'int' })
    message_id: number;

    @Column({ type: 'varchar', length: 500 })
    file_url: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @ManyToOne(() => Message, message => message.attachments)
    @JoinColumn({ name: 'message_id' })
    message: Message;
}