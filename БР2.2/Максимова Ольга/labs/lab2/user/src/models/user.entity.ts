import {
     Entity,
     Column,
     PrimaryGeneratedColumn,
     BaseEntity,
     CreateDateColumn,
     UpdateDateColumn
 } from 'typeorm';
import { Role } from '../models/role.enum'; 

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role!: Role;

    @Column({ type: 'varchar', length: 100 })
    first_name!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    middle_name?: string;

    @Column({ type: 'varchar', length: 100 })
    last_name!: string;

    @Column({ type: 'varchar', length: 300, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 150 })
    password!: string;

    @Column({ type: 'boolean', default: false })
    is_verified!: boolean;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;
}

