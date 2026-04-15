import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "menu_items" })
export class MenuItemEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  restaurantId!: string;

  @Column()
  name!: string;

  @Column({ type: "float" })
  price!: number;
}
