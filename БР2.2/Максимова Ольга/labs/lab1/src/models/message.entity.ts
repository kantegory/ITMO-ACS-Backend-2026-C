import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Accommodation } from './accommodation.entity';
import { MessageAttach } from './messageAttach.entity';

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file'
}

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'int' })
    sender_id: number;

    @Column({ type: 'int' })
    receiver_id: number;

    @Column({ type: 'int' })
    accom_id: number;

    @Column({ type: 'text' })
    mes_text: string;

    @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
    mes_type: MessageType;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @ManyToOne(() => User, user => user.sent_messages)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @ManyToOne(() => User, user => user.received_messages)
    @JoinColumn({ name: 'receiver_id' })
    receiver: User;

    @ManyToOne(() => Accommodation, accommodation => accommodation.messages)
    @JoinColumn({ name: 'accom_id' })
    accommodation: Accommodation;

    @OneToMany(() => MessageAttach, attach => attach.message)
    attachments: MessageAttach[];
}