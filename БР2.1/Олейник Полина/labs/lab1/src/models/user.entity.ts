import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Role } from './enums/role.enum';

// Модель (Entity) — это класс, который TypeORM превращает в таблицу базы данных.
// Каждое поле класса с декоратором @Column становится колонкой таблицы.
// Эта модель описывает таблицу "user" — пользователей приложения.
@Entity()
export class User {
    @PrimaryGeneratedColumn() // первичный ключ, генерируется автоматически (1, 2, 3, ...)
    id: number;

    @Column({ type: 'enum', enum: Role, default: Role.USER }) // роль по умолчанию — обычный пользователь
    role: Role;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false }) // unique — два пользователя не могут иметь одинаковый email
    email: string;

    @Column({ type: 'varchar', length: 150, nullable: false }) // здесь хранится не сам пароль, а его хэш (см. user.subscriber.ts)
    password: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    last_name: string;

    @Column({ type: 'varchar', length: 30, nullable: true }) // телефон необязателен
    phone: string | null;

    @CreateDateColumn({ type: 'timestamptz' }) // дата создания проставляется автоматически при первом сохранении
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' }) // дата обновляется автоматически при каждом save()
    updated_at: Date;
}
