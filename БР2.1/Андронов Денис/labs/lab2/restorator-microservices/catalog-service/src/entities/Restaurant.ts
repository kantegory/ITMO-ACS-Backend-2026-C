import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Restaurant {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    city!: string;

    @Column({ default: true }) 
    isActive!: boolean; 
}