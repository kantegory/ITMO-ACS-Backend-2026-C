import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Property } from './property.entity';
import { RentDeal } from './rent-deal.entity';
import { Review } from './review.entity';
import { Message } from './message.entity';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 300, nullable: false })
    fullName: string;

    @Column({ type: 'varchar', length: 150, nullable: false, select: false })
    password: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Property, (property) => property.owner)
    properties: Property[];

    @OneToMany(() => RentDeal, (deal) => deal.tenant)
    rentalsAsTenant: RentDeal[];

    @OneToMany(() => RentDeal, (deal) => deal.owner)
    rentalsAsOwner: RentDeal[];

    @OneToMany(() => Review, (review) => review.author)
    authoredReviews: Review[];

    @OneToMany(() => Review, (review) => review.targetUser)
    receivedReviews: Review[];

    @OneToMany(() => Message, (message) => message.sender)
    messages: Message[];
}
