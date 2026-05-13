import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany } from 'typeorm';
import { PropertyFacility } from './property-facility.entity';
import { Chat } from './chat.entity';



@Entity()
export class Property extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 200, nullable: false })
    propertyName!: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    propertyType!: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    propertyAdress!: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    propertyDescription!: string;

    @Column({type: 'float', nullable: false })  
    propertyPrice!: number;

    @Column({ type: 'varchar', length: 200, nullable: false })
    propertyStatus!: string;

    @Column({type: 'float', nullable: false })
    propertyOwnerId!: number;

    @Column({type: 'float', nullable: false })
    propertyCityId!: number;

    @OneToMany(() => PropertyFacility, pf => pf.property, { cascade: true, eager: true })
    facilities!: PropertyFacility[];

    @OneToMany(() => Chat, chat => chat.property, { cascade: true })
    chats!: Chat[];
}