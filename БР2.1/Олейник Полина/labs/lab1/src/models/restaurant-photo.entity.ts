import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

// Фотографии ресторана. У ресторана может быть много фото, но не более одного главного.
@Entity()
// Частичный уникальный индекс: уникальность требуется ТОЛЬКО среди строк,
// где is_main = true. То есть у ресторана может быть сколько угодно фото
// с is_main = false, но is_main = true — максимум одно. Обычный @Unique
// так не умеет (он проверял бы уникальность restaurant_id вообще, что не то).
@Index(['restaurant_id'], { unique: true, where: '"is_main" = true' })
export class RestaurantPhoto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) restaurant_id: number;

    @ManyToOne(() => Restaurant, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ type: 'varchar', length: 500, nullable: false })
    url: string;

    @Column({ type: 'boolean', default: false })
    is_main: boolean; // главное фото ресторана (превью в списке)

    @Column({ type: 'int', default: 0 })
    sort_order: number; // порядок показа в галерее — чем меньше число, тем раньше

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
