import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Role } from './enums/role.enum';

// Копия лр1/src/models/user.entity.ts.
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    last_name: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    phone: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
