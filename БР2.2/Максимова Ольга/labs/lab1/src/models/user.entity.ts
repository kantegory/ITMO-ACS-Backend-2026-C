import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany } from 'typeorm';
import { Accommodation } from './accommodation.entity';
import { Rent } from './rent.entity';
import { Message } from './message.entity';

export enum Role {
    ADMIN = 'admin',
    USER = 'user'
}

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({ type: 'varchar', length: 100 })
    first_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    middle_name: string;

    @Column({ type: 'varchar', length: 100 })
    last_name: string;

    @Column({ type: 'varchar', length: 300, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 150 })
    password: string;

    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @OneToMany(() => Accommodation, accommodation => accommodation.landlord)
    accommodations: Accommodation[];

    @OneToMany(() => Rent, rent => rent.tenant)
    rents_as_tenant: Rent[];

    @OneToMany(() => Rent, rent => rent.landlord)
    rents_as_landlord: Rent[];

    @OneToMany(() => Message, message => message.sender)
    sent_messages: Message[];

    @OneToMany(() => Message, message => message.receiver)
    received_messages: Message[];
}