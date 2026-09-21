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

// Главная сущность приложения — ресторан.
// @Check — это ограничения ПРЯМО НА УРОВНЕ БАЗЫ ДАННЫХ (SQL CHECK CONSTRAINT):
// даже если баг в коде пропустит неверное значение, Postgres сам его отклонит.
@Entity()
@Check(`"average_check" >= 0`) // средний чек не может быть отрицательным
@Check(`"rating" >= 0 AND "rating" <= 5`) // рейтинг — от 0 до 5
@Check(`"latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)`) // допустимые координаты широты
@Check(`"longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)`) // и долготы
export class Restaurant {
    @PrimaryGeneratedColumn()
    id: number;

    // Внешний ключ на город. Колонка city_id хранит просто число,
    // а свойство city (ниже) — это "удобная ссылка" на весь объект City,
    // TypeORM сам подставит его, если явно попросить (relations: ['city']).
    @Column({ type: 'int' }) city_id: number; // { type: 'int' } нужен явно — иначе TypeORM
    // не может угадать тип из-за особенностей tsx (см. README.md, "Известные особенности")

    @ManyToOne(() => City, { onDelete: 'RESTRICT', nullable: false }) // RESTRICT — нельзя удалить город, пока на него ссылается ресторан
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
    district: string | null; // район города

    @Column({ type: 'varchar', length: 255, nullable: true })
    address: string | null;

    // numeric-колонки Postgres драйвер возвращает строкой ("1800.00"), а не числом —
    // transformer автоматически переводит строку в number при чтении из базы
    // и обратно при записи (см. utils/numeric-transformer.ts).
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
    average_check: number; // средний чек на гостя — вводит администратор при создании

    @Column({
        type: 'numeric',
        precision: 3,
        scale: 2,
        default: 0,
        transformer: numericTransformer,
    })
    rating: number; // средняя оценка по отзывам — пересчитывается сервером автоматически, вручную никогда не задаётся

    // тип 'time' в Postgres хранит только время без даты. Из базы приходит "HH:MM:SS",
    // а спецификации нужен "HH:MM" — обрезка делается отдельно, в dto (utils/time-format.ts)
    @Column({ type: 'time', nullable: false })
    opening_time: string;

    @Column({ type: 'time', nullable: false })
    closing_time: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean; // если false — ресторан скрыт из поиска (используется вместо настоящего удаления)

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
