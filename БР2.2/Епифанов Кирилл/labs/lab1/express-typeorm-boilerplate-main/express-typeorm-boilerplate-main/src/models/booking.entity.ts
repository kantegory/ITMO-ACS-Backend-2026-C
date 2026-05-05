import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Booking extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int', nullable: false })
    propertyId!: number;

    @Column({ type: 'varchar', length: 200, nullable: false })
    startDate!: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    endDate!: string;

    @Column({ type: 'float', nullable: false })
    totalPrice!: number;

    @Column({ type: 'varchar', length: 200, nullable: false })
    status!: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    createdAt!: string;

}