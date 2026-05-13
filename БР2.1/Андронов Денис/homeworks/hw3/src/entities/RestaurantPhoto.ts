import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("restaurant_photos")
export class RestaurantPhoto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    restaurant_id: number;

    @Column()
    image_url: string;
}