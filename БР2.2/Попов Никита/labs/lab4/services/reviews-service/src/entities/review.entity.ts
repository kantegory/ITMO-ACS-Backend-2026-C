import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "reviews" })
export class ReviewEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  restaurantId!: string;

  @Column({ type: "int" })
  rating!: number;

  @Column({ nullable: true })
  text?: string;
}
