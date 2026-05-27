import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Reservation {
    @PrimaryGeneratedColumn()
    id!: number;

    // храним id из других баз
    @Column()
    userId!: number;

    @Column()
    restaurantId!: number;

    @Column()
    date!: string;
}