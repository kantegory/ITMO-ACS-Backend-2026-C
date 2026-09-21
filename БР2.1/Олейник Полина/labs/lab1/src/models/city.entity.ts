import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// Справочник городов. Используется как фильтр при поиске ресторанов
// (restaurant.city_id ссылается сюда).
@Entity()
export class City {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false }) // два города с одинаковым названием — нельзя
    name: string;
}
