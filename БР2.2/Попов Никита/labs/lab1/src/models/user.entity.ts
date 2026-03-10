import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
} from 'typeorm';

export enum UserRole {
    ADMIN = 'ADMIN',
    OWNER = 'OWNER',
    CLIENT = 'CLIENT',
}

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    firstName: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    lastName: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    role: UserRole;

    @CreateDateColumn()
    createdAt: Date;
}
