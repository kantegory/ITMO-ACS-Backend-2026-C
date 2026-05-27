import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

// enum для ролей
export enum UserRole {
    ADMIN = "ADMIN",
    STAFF = "STAFF",
    USER = "USER"
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({ nullable: true })
    middle_name: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // скрываем пароль по умолчанию при селекте
    password: string;

    @Column({ default: false })
    is_verified: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}