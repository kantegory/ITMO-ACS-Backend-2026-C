import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Property } from './property.entity';
import { User } from './user.entity';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer', nullable: false })
    rating: number;

    @Column({ type: 'text', nullable: false })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Property, (property) => property.reviews, {
        nullable: true,
    })
    property: Property;

    @Column({ type: 'integer', nullable: true })
    propertyId: number;

    @ManyToOne(() => User, (user) => user.authoredReviews, { nullable: false })
    author: User;

    @Column({ type: 'integer' })
    authorId: number;

    @ManyToOne(() => User, (user) => user.receivedReviews, { nullable: true })
    targetUser: User;

    @Column({ type: 'integer', nullable: true })
    targetUserId: number;
}
