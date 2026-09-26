import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Check,
} from 'typeorm';

import { City } from './city.entity';
import { Cuisine } from './cuisine.entity';
import numericTransformer from '../utils/numeric-transformer';

// Копия лр1/src/models/restaurant.entity.ts.
@Entity()
@Check(`"average_check" >= 0`)
@Check(`"rating" >= 0 AND "rating" <= 5`)
@Check(`"latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)`)
@Check(`"longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)`)
export class Restaurant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' }) city_id: number;

    @ManyToOne(() => City, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ type: 'int' }) cuisine_id: number;

    @ManyToOne(() => Cuisine, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'cuisine_id' })
    cuisine: Cuisine;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    district: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    address: string | null;

    @Column({
        type: 'numeric',
        precision: 9,
        scale: 6,
        nullable: true,
        transformer: numericTransformer,
    })
    latitude: number | null;

    @Column({
        type: 'numeric',
        precision: 9,
        scale: 6,
        nullable: true,
        transformer: numericTransformer,
    })
    longitude: number | null;

    @Column({ type: 'varchar', length: 30, nullable: true })
    phone: string | null;

    @Column({
        type: 'numeric',
        precision: 10,
        scale: 2,
        nullable: false,
        transformer: numericTransformer,
    })
    average_check: number;

    @Column({
        type: 'numeric',
        precision: 3,
        scale: 2,
        default: 0,
        transformer: numericTransformer,
    })
    rating: number;

    @Column({ type: 'time', nullable: false })
    opening_time: string;

    @Column({ type: 'time', nullable: false })
    closing_time: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
