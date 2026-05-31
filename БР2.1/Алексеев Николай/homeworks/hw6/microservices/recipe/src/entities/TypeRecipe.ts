import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('type_recipes')
export class TypeRecipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;
}