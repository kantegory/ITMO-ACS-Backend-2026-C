import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('favorites')
export class Favorite {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  recipeId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
