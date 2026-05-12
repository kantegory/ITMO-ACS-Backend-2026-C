import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { EstateForRent } from './estate-for-rent.entity';
import { Deal } from './deal.entity';
import { Review } from './review.entity';
import { Chat } from './chat.entity';
import { Message } from './message.entity';

export enum UserType {
    TENANT = 'tenant',
    LANDLORD = 'landlord',
}

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @Column({
        name: 'name',
        type: 'text',
    })
    name: string;

    @Column({
        name: 'email',
        type: 'varchar',
        length: 255,
        unique: true,
    })
    email: string;

    @Column({
        name: 'phone',
        type: 'varchar',
        length: 32,
        nullable: true,
    })
    phone: string | null;

    @Column({
        name: 'hashed_pw',
        type: 'text',
    })
    hashedPw: string;

    @Column({
        name: 'type',
        type: 'enum',
        enum: UserType,
    })
    type: UserType;

    @OneToMany(() => EstateForRent, (estate) => estate.owner)
    estates: EstateForRent[];

    @OneToMany(() => Deal, (deal) => deal.landlord)
    landlordDeals: Deal[];

    @OneToMany(() => Deal, (deal) => deal.tenant)
    tenantDeals: Deal[];

    @OneToMany(() => Review, (review) => review.author)
    writtenReviews: Review[];

    @OneToMany(() => Review, (review) => review.target)
    receivedReviews: Review[];

    @OneToMany(() => Chat, (chat) => chat.user1)
    chatsAsUser1: Chat[];

    @OneToMany(() => Chat, (chat) => chat.user2)
    chatsAsUser2: Chat[];

    @OneToMany(() => Message, (message) => message.sender)
    messages: Message[];
}
