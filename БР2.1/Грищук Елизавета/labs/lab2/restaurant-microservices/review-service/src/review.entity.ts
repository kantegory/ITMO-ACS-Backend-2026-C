import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'int' })
    restaurantId: number;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;
}