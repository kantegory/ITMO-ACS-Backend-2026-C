import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// Справочник кухонь (итальянская, японская и т.д.) — та же идея, что и City,
// используется как фильтр при поиске ресторанов.
@Entity()
export class Cuisine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    name: string;
}
