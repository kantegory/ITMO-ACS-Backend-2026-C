import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Check,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';
import { MenuCategory } from './enums/menu-category.enum';
import numericTransformer from '../utils/numeric-transformer';

// Позиция меню ресторана: одно блюдо или напиток.
@Entity()
@Check(`"price" >= 0`) // цена не может быть отрицательной
export class MenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'enum', enum: MenuCategory })
    category: MenuCategory;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({
        type: 'numeric',
        precision: 10,
        scale: 2,
        nullable: false,
        transformer: numericTransformer, // строка из БД -> число в ответе API
    })
    price: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    photo_url: string | null;

    @Column({ type: 'boolean', default: true })
    is_available: boolean; // блюдо временно недоступно (закончилось), но само не удаляется из меню
}
