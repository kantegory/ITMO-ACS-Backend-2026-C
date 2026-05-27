import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("cities")
export class City {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    external_id: number;

    @Column()
    name: string;

    @Column()
    region_id: number;
}