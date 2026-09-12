import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn()
  id!: number;

  // "г", "кг", "мл", "л", "шт" и т.д.
  @Column({ unique: true })
  name!: string;
}
