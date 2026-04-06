import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";

import { User } from "./User";
import { Address } from "./Address";
import { PropertyType } from "./PropertyType";

@Entity("properties")
export class Property {
  // Первичный ключ
@PrimaryGeneratedColumn()
    id!: number;

    // Внешний ключ на владельца
    @Column()
    ownerId!: number;

    // Внешний ключ на тип недвижимости
    @Column()
    typeId!: number;

    // Внешний ключ на адрес
    @Column()
    addressId!: number;

    // Название объекта
    @Column({ length: 255 })
    title!: string;

    // Описание
    @Column({ type: "text" })
    description!: string;

    // Цена за день
    @Column({ type: "decimal", precision: 10, scale: 2 })
    pricePerDay!: string;

    // Цена за месяц
    @Column({ type: "decimal", precision: 10, scale: 2 })
    pricePerMonth!: string;

    // Площадь в квадратных метрах
    @Column({ type: "int" })
    areaSqM!: number;

    // Максимум гостей
    @Column({ type: "int" })
    maxGuests!: number;

    // Количество спален
    @Column({ type: "int" })
    bedrooms!: number;

    // Количество ванных комнат
    @Column({ type: "int" })
    bathrooms!: number;

    // Доступен ли объект сейчас
    @Column({ default: true })
    isAvailable!: boolean;

    // Минимальное число дней аренды
    @Column({ type: "int" })
    minRentDays!: number;

    // Максимальное число дней аренды
    @Column({ type: "int" })
    maxRentDays!: number;

    // Связь с владельцем
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "ownerId" })
    owner!: User;

    // Связь с типом недвижимости
    @ManyToOne(() => PropertyType, { eager: true })
    @JoinColumn({ name: "typeId" })
    type!: PropertyType;

    // Связь с адресом
    @ManyToOne(() => Address, { eager: true })
    @JoinColumn({ name: "addressId" })
    address!: Address;

    // Дата создания
    @CreateDateColumn()
    createdAt!: Date;

    // Дата обновления
    @UpdateDateColumn()
    updatedAt!: Date;
    }