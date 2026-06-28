import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Restaurant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    categoryId: number;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    address: string;

    @Column({ type: 'int' })
    priceRange: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', nullable: true })
    photoUrl: string;
}