import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('estate_types')
export class EstateType extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'smallint' })
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    name: string;
}
