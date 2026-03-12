import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
} from 'typeorm';
import { UserType } from './enums';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'text', nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 32, nullable: true })
    phone: string | null;

    @Column({ type: 'text', name: 'hashed_pw', nullable: false })
    password: string;

    @Column({
        type: 'enum',
        enum: UserType,
        nullable: false,
    })
    type: UserType;
}
