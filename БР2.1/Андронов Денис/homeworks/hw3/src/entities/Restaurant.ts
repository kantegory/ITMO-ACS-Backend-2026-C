import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("restaurants")
export class Restaurant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column("text")
    description: string;

    @Column()
    city_id: number;

    @Column({ nullable: true })
    cuisine_id: number; // добавил для фильтрации по кухне из tsp

    @Column()
    address: string;

    @Column()
    price_category: string;

    @Column()
    phone: string;

    @Column({ type: "float", nullable: true })
    average_rating: number;

    @CreateDateColumn()
    created_at: Date;
}