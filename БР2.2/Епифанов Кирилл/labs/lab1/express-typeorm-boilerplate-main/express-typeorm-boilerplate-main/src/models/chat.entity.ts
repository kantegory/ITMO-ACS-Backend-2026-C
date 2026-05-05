import { Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from './message.entity';
import { Property } from './property.entity';

@Entity()
export class Chat {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Property, property => property.chats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'propertyId' })
    property!: Property;

    @OneToMany(() => Message, message => message.chat, { cascade: true, eager: true })
    messages!: Message[];
}