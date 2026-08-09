import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany
} from 'typeorm';
import { User } from './User.entity';
import { Deal } from './Deal.entity';

export enum EstateType {
    APARTMENT = 'apartment',
    COTTAGE = 'cottage',
    ROOM = 'room'
}

export enum BathType {
    SHOWER = 'shower',
    BATHTUB = 'bathtub'
}

@Entity('estates')
export class Estate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    user_id: number;

    @Column()
    address: string;

    @Column({ type: 'enum', enum: EstateType })
    type: EstateType;

    @Column({ name: 'room_amount' })
    room_amount: number;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: 'float' })
    price: number;

    @Column({ name: 'image_path', nullable: true })
    image_path?: string;

    @Column({ name: 'bath_type', type: 'enum', enum: BathType, nullable: true })
    bath_type?: BathType;

    @Column({ default: false })
    fridge?: boolean;

    @Column({ name: 'washing_machine', default: false })
    washing_machine?: boolean;

    @Column({ default: false })
    internet?: boolean;

    @Column({ default: false })
    tv?: boolean;

    @Column({ name: 'furnished_rooms', default: false })
    furnished_rooms?: boolean;

    @Column({ name: 'furnished_kitchen', default: false })
    furnished_kitchen?: boolean;

    @Column({ name: 'is_verified', default: false })
    is_verified: boolean;

    @Column({ name: 'is_available', default: true })
    is_available: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updated_at?: Date;

    @ManyToOne(() => User, user => user.estates)
    user: User;

    @ManyToMany(() => Deal, deal => deal.estates)
    deals: Deal[];
}
