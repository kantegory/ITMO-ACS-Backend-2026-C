import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// Копия лр1/src/models/city.entity.ts.
@Entity()
export class City {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    name: string;
}
