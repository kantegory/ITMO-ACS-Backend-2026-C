import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

// Физический столик в ресторане, на который можно оформить бронь.
@Entity()
@Unique(['restaurant_id', 'number']) // номер столика уникален в пределах одного ресторана (но не глобально)
@Check(`"capacity" > 0`)
export class RestaurantTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'varchar', length: 50, nullable: false })
    number: string; // это номер/название столика (например "A1"), не порядковый индекс

    @Column({ type: 'int', nullable: false })
    capacity: number; // сколько гостей помещается за столик

    @Column({ type: 'varchar', length: 100, nullable: true })
    zone: string | null; // зона зала (например "Терраса")

    @Column({ type: 'boolean', default: true })
    is_active: boolean; // если false — столик временно недоступен для бронирования
}
