import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('regions')
export class Region {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  external_id!: number;

  @Column({ length: 100 })
  name!: string;
}
