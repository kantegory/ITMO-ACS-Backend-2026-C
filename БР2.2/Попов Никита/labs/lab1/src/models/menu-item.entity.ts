import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

@Entity()
export class MenuItem extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    restaurantId: string;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuItems, {
        onDelete: 'CASCADE',
    })
    restaurant: Restaurant;

    @Column({ type: 'uuid' })
    categoryId: string;

    @Column({ type: 'varchar', length: 300 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'float' })
    price: number;
}

