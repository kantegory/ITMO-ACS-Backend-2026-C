import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;
}
