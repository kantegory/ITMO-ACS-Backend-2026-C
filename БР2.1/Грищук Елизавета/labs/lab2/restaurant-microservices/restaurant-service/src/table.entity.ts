import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Table {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    restaurantId: number;

    @Column({ type: 'int' })
    capacity: number;
}