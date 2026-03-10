import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Property } from './property.entity';
import { Message } from './message.entity';

@Entity()
export class Conversation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: false })
    user1: User;

    @Column({ type: 'integer' })
    user1Id: number;

    @ManyToOne(() => User, { nullable: false })
    user2: User;

    @Column({ type: 'integer' })
    user2Id: number;

    @ManyToOne(() => Property, (property) => property.conversations, {
        nullable: false,
    })
    property: Property;

    @Column({ type: 'integer' })
    propertyId: number;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];
}
