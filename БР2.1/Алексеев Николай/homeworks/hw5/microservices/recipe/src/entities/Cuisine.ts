import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;
}